"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toKST } from "@/lib/datetime";
import { formatPrice } from "@/lib/utils";
import { Calendar, Clock, Loader2, X } from "lucide-react";
import { CalendarSyncButton } from "@/components/calendar/calendar-sync";

interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  price: number;
  notes?: string | null;
  counselor: {
    id: string;
    sessionDuration: number;
    user: {
      name: string | null;
      profileImage: string | null;
    };
  };
  client?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface AppointmentListProps {
  appointments: Appointment[];
  type: "upcoming" | "past";
  role: "client" | "counselor";
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" }> = {
  PENDING: { label: "대기중", variant: "warning" },
  CONFIRMED: { label: "확정", variant: "success" },
  CANCELLED: { label: "취소됨", variant: "destructive" },
  COMPLETED: { label: "완료", variant: "secondary" },
  NO_SHOW: { label: "노쇼", variant: "destructive" },
};

export function AppointmentList({ appointments, type, role }: AppointmentListProps) {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {type === "upcoming" ? "예정된 상담이 없습니다." : "지난 상담이 없습니다."}
        </p>
        {type === "upcoming" && role === "client" && (
          <Link href="/counselors">
            <Button variant="outline" className="mt-4">
              상담 예약하기
            </Button>
          </Link>
        )}
      </div>
    );
  }

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    setIsCancelling(true);

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "취소에 실패했습니다.");
      }

      toast({
        title: "예약 취소",
        description: "예약이 취소되었습니다.",
      });

      setCancelDialogOpen(false);
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "취소에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // 24시간 이내 예약인지 확인
  const isWithin24Hours = (startTime: Date) => {
    const now = new Date();
    const diff = new Date(startTime).getTime() - now.getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  return (
    <>
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const startTimeKST = toKST(appointment.startTime);
          const statusInfo = STATUS_LABELS[appointment.status] || {
            label: appointment.status,
            variant: "default" as const,
          };
          const initials = appointment.counselor.user.name?.[0] || "?";
          const canCancel =
            type === "upcoming" &&
            ["PENDING", "CONFIRMED"].includes(appointment.status) &&
            !isWithin24Hours(appointment.startTime);

          return (
            <div
              key={appointment.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* 상담사 정보 */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar>
                  <AvatarImage
                    src={appointment.counselor.user.profileImage || undefined}
                    alt={appointment.counselor.user.name || "상담사"}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {role === "client"
                      ? appointment.counselor.user.name || "상담사"
                      : appointment.client?.name || "내담자"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{appointment.counselor.sessionDuration}분</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">
                      {formatPrice(appointment.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 일시 */}
              <div className="flex flex-col sm:items-end text-sm">
                <p className="font-medium">
                  {format(startTimeKST, "M월 d일 (EEEE)", { locale: ko })}
                </p>
                <p className="text-muted-foreground">
                  {format(startTimeKST, "HH:mm")}
                </p>
              </div>

              {/* 상태 및 액션 */}
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {type === "upcoming" && ["PENDING", "CONFIRMED"].includes(appointment.status) && (
                  <CalendarSyncButton appointmentId={appointment.id} variant="ghost" size="sm" />
                )}
                {canCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelClick(appointment)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 취소 확인 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 취소</DialogTitle>
            <DialogDescription>
              정말 이 예약을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">상담사: </span>
                {selectedAppointment.counselor.user.name}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">일시: </span>
                {format(toKST(selectedAppointment.startTime), "yyyy년 M월 d일 HH:mm", {
                  locale: ko,
                })}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              닫기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  취소 중...
                </>
              ) : (
                "예약 취소"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
