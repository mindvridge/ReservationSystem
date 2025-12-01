"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toKST } from "@/lib/datetime";
import { formatPrice } from "@/lib/utils";
import { Loader2, User, Clock, Phone, Mail } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    client: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
    price: number;
    notes: string | null;
  };
}

interface CounselorCalendarProps {
  counselorId: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  PENDING: { bg: "#fbbf24", border: "#f59e0b" },
  CONFIRMED: { bg: "#3b82f6", border: "#2563eb" },
  COMPLETED: { bg: "#10b981", border: "#059669" },
  CANCELLED: { bg: "#ef4444", border: "#dc2626" },
  NO_SHOW: { bg: "#6b7280", border: "#4b5563" },
};

export function CounselorCalendar({ counselorId }: CounselorCalendarProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [counselorId]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/appointments?role=counselor`);
      if (response.ok) {
        const data = await response.json();
        const calendarEvents: CalendarEvent[] = data.appointments.map(
          (apt: {
            id: string;
            status: string;
            startTime: string;
            endTime: string;
            client: { name: string | null; email: string | null; phone: string | null };
            price: number;
            notes: string | null;
          }) => {
            const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.PENDING;
            return {
              id: apt.id,
              title: apt.client.name || "내담자",
              start: new Date(apt.startTime),
              end: new Date(apt.endTime),
              backgroundColor: colors.bg,
              borderColor: colors.border,
              extendedProps: {
                status: apt.status,
                client: apt.client,
                price: apt.price,
                notes: apt.notes,
              },
            };
          }
        );
        setEvents(calendarEvents);
      }
    } catch {
      toast({
        title: "오류",
        description: "일정을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsDialogOpen(true);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(
        `/api/appointments/${selectedEvent.id}/complete`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast({
          title: "완료",
          description: "상담이 완료 처리되었습니다.",
        });
        setIsDialogOpen(false);
        loadAppointments();
      } else {
        throw new Error("처리 실패");
      }
    } catch {
      toast({
        title: "오류",
        description: "상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="fc-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="ko"
          events={events}
          eventClick={handleEventClick}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          height="auto"
          aspectRatio={1.8}
          buttonText={{
            today: "오늘",
            month: "월",
            week: "주",
            day: "일",
          }}
        />
      </div>

      {/* 이벤트 상세 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상담 상세 정보</DialogTitle>
            <DialogDescription>
              예약된 상담의 상세 정보입니다.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedEvent.extendedProps.client.name || "이름 없음"}
                  </span>
                </div>
                <Badge
                  variant={
                    selectedEvent.extendedProps.status === "CONFIRMED"
                      ? "success"
                      : selectedEvent.extendedProps.status === "COMPLETED"
                      ? "secondary"
                      : selectedEvent.extendedProps.status === "CANCELLED"
                      ? "destructive"
                      : "default"
                  }
                >
                  {selectedEvent.extendedProps.status === "PENDING"
                    ? "대기중"
                    : selectedEvent.extendedProps.status === "CONFIRMED"
                    ? "확정"
                    : selectedEvent.extendedProps.status === "COMPLETED"
                    ? "완료"
                    : selectedEvent.extendedProps.status === "CANCELLED"
                    ? "취소됨"
                    : selectedEvent.extendedProps.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(toKST(selectedEvent.start), "yyyy년 M월 d일 (EEEE) HH:mm", {
                      locale: ko,
                    })}
                  </span>
                </div>

                {selectedEvent.extendedProps.client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.extendedProps.client.email}</span>
                  </div>
                )}

                {selectedEvent.extendedProps.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.extendedProps.client.phone}</span>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">상담 비용: </span>
                  <span className="font-medium text-primary">
                    {formatPrice(selectedEvent.extendedProps.price)}
                  </span>
                </div>

                {selectedEvent.extendedProps.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground mb-1">내담자 메모:</p>
                    <p className="bg-muted p-2 rounded text-sm">
                      {selectedEvent.extendedProps.notes}
                    </p>
                  </div>
                )}
              </div>

              {selectedEvent.extendedProps.status === "CONFIRMED" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    닫기
                  </Button>
                  <Button onClick={handleCompleteAppointment} className="flex-1">
                    상담 완료
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
