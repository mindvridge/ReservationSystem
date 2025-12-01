"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";

interface ScheduleException {
  id: string;
  date: Date;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface ExceptionScheduleListProps {
  counselorId: string;
  exceptions: ScheduleException[];
}

export function ExceptionScheduleList({
  counselorId,
  exceptions: initialExceptions,
}: ExceptionScheduleListProps) {
  const { toast } = useToast();
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 새 예외 폼 상태
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [exceptionType, setExceptionType] = useState<"block" | "custom">("block");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");

  const handleAddException = async () => {
    if (!selectedDate) {
      toast({
        title: "오류",
        description: "날짜를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/counselor/schedule/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId,
          date: format(selectedDate, "yyyy-MM-dd"),
          isAvailable: exceptionType === "custom",
          startTime: exceptionType === "custom" ? startTime : null,
          endTime: exceptionType === "custom" ? endTime : null,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("저장에 실패했습니다.");
      }

      const data = await response.json();

      setExceptions((prev) => [...prev, data.exception]);

      toast({
        title: "저장 완료",
        description: "예외 일정이 추가되었습니다.",
      });

      // 폼 초기화
      setSelectedDate(undefined);
      setExceptionType("block");
      setStartTime("09:00");
      setEndTime("18:00");
      setReason("");
      setIsDialogOpen(false);
    } catch {
      toast({
        title: "오류",
        description: "예외 일정 추가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    try {
      const response = await fetch(
        `/api/counselor/schedule/exception/${exceptionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("삭제에 실패했습니다.");
      }

      setExceptions((prev) => prev.filter((e) => e.id !== exceptionId));

      toast({
        title: "삭제 완료",
        description: "예외 일정이 삭제되었습니다.",
      });
    } catch {
      toast({
        title: "오류",
        description: "예외 일정 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 추가 버튼 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            예외 일정 추가
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>예외 일정 추가</DialogTitle>
            <DialogDescription>
              특정 날짜의 예외 일정을 설정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 날짜 선택 */}
            <div className="space-y-2">
              <Label>날짜 선택</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                locale={ko}
                className="rounded-md border mx-auto"
              />
            </div>

            {/* 예외 유형 */}
            <div className="space-y-2">
              <Label>예외 유형</Label>
              <Select
                value={exceptionType}
                onValueChange={(v) => setExceptionType(v as "block" | "custom")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">휴무 (예약 불가)</SelectItem>
                  <SelectItem value="custom">특별 가용 시간</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 시간 설정 (custom일 때만) */}
            {exceptionType === "custom" && (
              <div className="space-y-2">
                <Label>가용 시간</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <span>~</span>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 사유 */}
            <div className="space-y-2">
              <Label>사유 (선택)</Label>
              <Textarea
                placeholder="휴가, 연수 등"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleAddException} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "추가"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 예외 목록 */}
      {exceptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>설정된 예외 일정이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">
                    {format(new Date(exception.date), "yyyy년 M월 d일 (EEEE)", {
                      locale: ko,
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={exception.isAvailable ? "success" : "destructive"}
                    >
                      {exception.isAvailable ? "특별 가용" : "휴무"}
                    </Badge>
                    {exception.isAvailable && exception.startTime && (
                      <span className="text-sm text-muted-foreground">
                        {exception.startTime} - {exception.endTime}
                      </span>
                    )}
                    {exception.reason && (
                      <span className="text-sm text-muted-foreground">
                        ({exception.reason})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteException(exception.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
