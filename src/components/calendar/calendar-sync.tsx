"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarSyncButtonProps {
  appointmentId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CalendarSyncButton({
  appointmentId,
  variant = "outline",
  size = "sm",
}: CalendarSyncButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<{
    google?: string;
    outlook?: string;
    yahoo?: string;
    ics?: string;
  } | null>(null);

  const fetchLinks = async () => {
    if (links) return; // 이미 로드됨

    setLoading(true);
    try {
      const response = await fetch(`/api/calendar/links/${appointmentId}`);
      if (!response.ok) throw new Error("Failed to fetch links");
      const data = await response.json();
      setLinks(data.links);
    } catch {
      toast({
        title: "오류",
        description: "캘린더 링크를 불러오지 못했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCalendar = () => {
    if (links?.google) {
      window.open(links.google, "_blank", "noopener,noreferrer");
    }
  };

  const handleOutlookCalendar = () => {
    if (links?.outlook) {
      window.open(links.outlook, "_blank", "noopener,noreferrer");
    }
  };

  const handleYahooCalendar = () => {
    if (links?.yahoo) {
      window.open(links.yahoo, "_blank", "noopener,noreferrer");
    }
  };

  const handleICSDownload = () => {
    if (links?.ics) {
      window.location.href = links.ics;
      toast({
        title: "다운로드 시작",
        description: "ICS 파일 다운로드가 시작됩니다.",
      });
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchLinks()}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          캘린더에 추가
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>캘린더 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleGoogleCalendar}
          disabled={!links?.google}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zm-2.25 6h-3.75v3h3.75v1.5h-3.75V18h-3v-4.5H6.75v-1.5h3.75V9h-3.75V7.5h3.75V6h3v1.5h3.75V9z"
            />
          </svg>
          Google Calendar
          <ExternalLink className="h-3 w-3 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleOutlookCalendar}
          disabled={!links?.outlook}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M7.88 12.04c0 .94-.24 1.7-.72 2.28-.48.58-1.14.87-1.98.87-.84 0-1.5-.29-1.98-.87-.48-.58-.72-1.34-.72-2.28 0-.94.24-1.7.72-2.28.48-.58 1.14-.87 1.98-.87.84 0 1.5.29 1.98.87.48.58.72 1.34.72 2.28zm10.01.24c0 .6-.16 1.14-.49 1.61-.32.47-.77.83-1.35 1.08-.58.25-1.24.37-1.99.37h-3.29V6.9h3.29c.75 0 1.41.12 1.99.37.58.25 1.03.61 1.35 1.08.33.47.49 1.01.49 1.61v2.32z"
            />
          </svg>
          Outlook Calendar
          <ExternalLink className="h-3 w-3 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleYahooCalendar}
          disabled={!links?.yahoo}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.25 1.47l4.87 8.25-4.87 8.25h-4.5l4.87-8.25-4.87-8.25h4.5z"
            />
          </svg>
          Yahoo Calendar
          <ExternalLink className="h-3 w-3 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleICSDownload} disabled={!links?.ics}>
          <Download className="h-4 w-4 mr-2" />
          ICS 파일 다운로드
          <span className="text-xs text-muted-foreground ml-auto">Apple</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 캘린더 내보내기 버튼 (전체 예약)
interface CalendarExportButtonProps {
  type?: "all" | "upcoming" | "past";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function CalendarExportButton({
  type = "upcoming",
  variant = "outline",
  size = "default",
}: CalendarExportButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    const url = `/api/calendar/export?type=${type}`;
    window.location.href = url;
    toast({
      title: "다운로드 시작",
      description: "캘린더 파일 다운로드가 시작됩니다.",
    });
  };

  const typeLabel =
    type === "all"
      ? "모든 예약"
      : type === "upcoming"
      ? "예정된 예약"
      : "지난 예약";

  return (
    <Button variant={variant} size={size} onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      {typeLabel} 내보내기
    </Button>
  );
}
