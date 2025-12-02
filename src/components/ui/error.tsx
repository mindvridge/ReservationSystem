"use client";

import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Lock, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  type?: "default" | "network" | "server" | "auth" | "notfound";
  onRetry?: () => void;
  className?: string;
}

const errorIcons = {
  default: AlertCircle,
  network: WifiOff,
  server: ServerCrash,
  auth: Lock,
  notfound: FileQuestion,
};

const errorColors = {
  default: "text-destructive",
  network: "text-orange-500",
  server: "text-red-500",
  auth: "text-yellow-600",
  notfound: "text-gray-500",
};

// 에러 표시 컴포넌트
export function ErrorDisplay({
  title = "오류가 발생했습니다",
  message,
  type = "default",
  onRetry,
  className,
}: ErrorDisplayProps) {
  const Icon = errorIcons[type];
  const colorClass = errorColors[type];

  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardContent className="flex flex-col items-center text-center py-8 px-6">
        <Icon className={cn("h-12 w-12 mb-4", colorClass)} />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// 인라인 에러 메시지
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-destructive text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// 폼 필드 에러
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

// 알림 배너
interface AlertBannerProps {
  type: "error" | "warning" | "success" | "info";
  message: string;
  onClose?: () => void;
}

const bannerStyles = {
  error: "bg-red-50 border-red-200 text-red-700",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  success: "bg-green-50 border-green-200 text-green-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

export function AlertBanner({ type, message, onClose }: AlertBannerProps) {
  return (
    <div className={cn("p-4 border rounded-lg flex items-center justify-between", bannerStyles[type])}>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-current hover:opacity-70">
          ✕
        </button>
      )}
    </div>
  );
}

// 빈 상태 표시
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-4 max-w-md">{description}</p>}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// API 에러 파싱 헬퍼
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "알 수 없는 오류가 발생했습니다.";
}

// 에러 타입 판별 헬퍼
export function getErrorType(error: unknown): ErrorDisplayProps["type"] {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "network";
  }
  if (error instanceof Error) {
    if (error.message.includes("401") || error.message.includes("인증")) {
      return "auth";
    }
    if (error.message.includes("404") || error.message.includes("찾을 수 없")) {
      return "notfound";
    }
    if (error.message.includes("500") || error.message.includes("서버")) {
      return "server";
    }
  }
  return "default";
}
