"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, generateTimeSlots } from "@/lib/utils";
import { getWeekdayKo } from "@/lib/datetime";
import { Loader2, Clock, Calendar as CalendarIcon } from "lucide-react";

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface BookingCalendarProps {
  counselorId: string;
  counselorName: string;
  sessionDuration: number;
  sessionPrice: number;
  schedules: Schedule[];
}

export function BookingCalendar({
  counselorId,
  counselorName,
  sessionDuration,
  sessionPrice,
  schedules,
}: BookingCalendarProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notes, setNotes] = useState("");

  // 선택 가능한 날짜 범위 (오늘부터 60일)
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  // 해당 요일에 가용 시간이 있는지 확인
  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);
  };

  // 날짜 선택 가능 여부 확인
  const isDateDisabled = (date: Date) => {
    // 과거 날짜 비활성화
    if (isBefore(date, today)) return true;
    // 최대 날짜 초과 비활성화
    if (isBefore(maxDate, date)) return true;
    // 해당 요일에 가용 시간이 없으면 비활성화
    const dayOfWeek = date.getDay();
    return !getScheduleForDay(dayOfWeek);
  };

  // 날짜 선택 시 가용 시간 로드
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setBookedSlots([]);
      setSelectedTime(null);
      return;
    }

    const loadAvailableSlots = async () => {
      setIsLoading(true);
      setSelectedTime(null);

      try {
        const dayOfWeek = selectedDate.getDay();
        const schedule = getScheduleForDay(dayOfWeek);

        if (!schedule) {
          setAvailableSlots([]);
          setBookedSlots([]);
          return;
        }

        // 시간 슬롯 생성
        const slots = generateTimeSlots(
          schedule.startTime,
          schedule.endTime,
          sessionDuration
        );

        // 이미 예약된 시간 조회
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const response = await fetch(
          `/api/appointments/available?counselorId=${counselorId}&date=${dateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data.bookedSlots || []);
        }

        setAvailableSlots(slots);
      } catch {
        toast({
          title: "오류",
          description: "가용 시간을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableSlots();
  }, [selectedDate, counselorId, sessionDuration, schedules, toast]);

  // 예약 생성
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsBooking(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "예약에 실패했습니다.");
      }

      toast({
        title: "예약 완료",
        description: "예약이 성공적으로 완료되었습니다.",
        variant: "success",
      });

      setShowConfirmDialog(false);
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "예약 실패",
        description: error instanceof Error ? error.message : "예약에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  // 가용 시간 표시를 위한 요일 정보
  const weeklyScheduleInfo = schedules
    .filter((s) => s.isActive)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((s) => `${getWeekdayKo(s.dayOfWeek)} ${s.startTime}-${s.endTime}`)
    .join(", ");

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 주간 가용 시간 안내 */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">상담 가능 시간: </span>
          {weeklyScheduleInfo || "가용 시간이 설정되지 않았습니다."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 날짜 선택 */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            날짜 선택
          </h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            locale={ko}
            className="rounded-md border"
          />
        </div>

        {/* 시간 선택 */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            시간 선택
          </h3>

          {!selectedDate ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md">
              먼저 날짜를 선택해주세요.
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md">
              해당 날짜에 예약 가능한 시간이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
              {availableSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedTime === slot;

                return (
                  <Button
                    key={slot}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isBooked}
                    onClick={() => setSelectedTime(slot)}
                    className={isBooked ? "opacity-50 line-through" : ""}
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 예약 버튼 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {selectedDate && selectedTime && (
            <p>
              선택: {format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}{" "}
              {selectedTime}
            </p>
          )}
        </div>

        {isSignedIn ? (
          <Button
            size="lg"
            disabled={!selectedDate || !selectedTime}
            onClick={() => setShowConfirmDialog(true)}
          >
            예약하기
          </Button>
        ) : (
          <SignInButton mode="modal">
            <Button size="lg">로그인하고 예약하기</Button>
          </SignInButton>
        )}
      </div>

      {/* 예약 확인 다이얼로그 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 확인</DialogTitle>
            <DialogDescription>
              예약 정보를 확인하고 진행해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">상담사</span>
                <p className="font-medium">{counselorName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">상담 비용</span>
                <p className="font-medium text-primary">
                  {formatPrice(sessionPrice)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">일시</span>
                <p className="font-medium">
                  {selectedDate &&
                    format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">시간</span>
                <p className="font-medium">
                  {selectedTime} ({sessionDuration}분)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">메모 (선택사항)</Label>
              <Textarea
                id="notes"
                placeholder="상담사에게 전달할 내용이 있다면 적어주세요."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>
                * 예약 확정 후 SMS와 이메일로 알림을 보내드립니다.
              </p>
              <p>
                * 예약 취소는 상담 24시간 전까지 가능합니다.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isBooking}
            >
              취소
            </Button>
            <Button onClick={handleBooking} disabled={isBooking}>
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  예약 중...
                </>
              ) : (
                "예약 확정"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
