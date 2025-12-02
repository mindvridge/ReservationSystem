"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 스피너 로딩
export function Spinner({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
}

// 페이지 전체 로딩
export function PageLoading({ message = "로딩 중..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// 버튼 로딩
export function ButtonLoading({ children }: { children?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Spinner size="sm" />
      {children || "처리 중..."}
    </span>
  );
}

// 카드 스켈레톤
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// 상담사 카드 스켈레톤
export function CounselorCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

// 예약 목록 스켈레톤
export function AppointmentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 테이블 스켈레톤
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 캘린더 스켈레톤
export function CalendarSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}

// 통계 카드 스켈레톤
export function StatCardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// 인라인 로딩
export function InlineLoading({ message = "로딩 중..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Spinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
