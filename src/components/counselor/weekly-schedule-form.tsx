"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { WEEKDAYS_KO } from "@/lib/datetime";
import { Loader2 } from "lucide-react";

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface WeeklyScheduleFormProps {
  counselorId: string;
  schedules: Schedule[];
}

interface DaySchedule {
  isActive: boolean;
  startTime: string;
  endTime: string;
}

export function WeeklyScheduleForm({
  counselorId,
  schedules,
}: WeeklyScheduleFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // 초기 상태 설정
  const getInitialState = (): Record<number, DaySchedule> => {
    const state: Record<number, DaySchedule> = {};
    for (let i = 0; i < 7; i++) {
      const existing = schedules.find((s) => s.dayOfWeek === i);
      state[i] = existing
        ? {
            isActive: existing.isActive,
            startTime: existing.startTime,
            endTime: existing.endTime,
          }
        : {
            isActive: false,
            startTime: "09:00",
            endTime: "18:00",
          };
    }
    return state;
  };

  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DaySchedule>>(
    getInitialState()
  );

  const handleToggleDay = (day: number) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive: !prev[day].isActive,
      },
    }));
  };

  const handleTimeChange = (
    day: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/counselor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId,
          schedules: Object.entries(weeklySchedule).map(([day, data]) => ({
            dayOfWeek: parseInt(day),
            ...data,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("저장에 실패했습니다.");
      }

      toast({
        title: "저장 완료",
        description: "주간 일정이 저장되었습니다.",
      });
    } catch {
      toast({
        title: "오류",
        description: "일정 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
        <div
          key={day}
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg transition-colors ${
            weeklySchedule[day].isActive ? "bg-primary/5" : "bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3 min-w-[100px]">
            <input
              type="checkbox"
              checked={weeklySchedule[day].isActive}
              onChange={() => handleToggleDay(day)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label className="font-medium">{WEEKDAYS_KO[day]}요일</Label>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={weeklySchedule[day].startTime}
                onChange={(e) =>
                  handleTimeChange(day, "startTime", e.target.value)
                }
                disabled={!weeklySchedule[day].isActive}
                className="w-32"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="time"
                value={weeklySchedule[day].endTime}
                onChange={(e) =>
                  handleTimeChange(day, "endTime", e.target.value)
                }
                disabled={!weeklySchedule[day].isActive}
                className="w-32"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장하기"
          )}
        </Button>
      </div>
    </div>
  );
}
