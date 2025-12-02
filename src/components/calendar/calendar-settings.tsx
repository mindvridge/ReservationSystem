"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarExportButton } from "./calendar-sync";
import {
  Calendar,
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
} from "lucide-react";

export function CalendarSettings() {
  const [copied, setCopied] = useState(false);

  // 캘린더 구독 URL (향후 구현 가능)
  const subscriptionUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/calendar/subscribe`
      : "";

  const copySubscriptionUrl = () => {
    navigator.clipboard.writeText(subscriptionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 캘린더 내보내기 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            캘린더 내보내기
          </CardTitle>
          <CardDescription>
            예약 일정을 ICS 파일로 내보내 다른 캘린더 앱에서 가져올 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>예정된 예약</Label>
              <CalendarExportButton type="upcoming" size="sm" />
            </div>
            <div className="space-y-2">
              <Label>지난 예약</Label>
              <CalendarExportButton type="past" size="sm" />
            </div>
            <div className="space-y-2">
              <Label>모든 예약</Label>
              <CalendarExportButton type="all" size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 캘린더 앱 연동 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            캘린더 앱 연동 방법
          </CardTitle>
          <CardDescription>
            다운로드한 ICS 파일을 각 캘린더 앱에서 가져오는 방법입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Apple Calendar / iOS */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Smartphone className="h-4 w-4" />
              Apple Calendar (iPhone/iPad/Mac)
            </div>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-6">
              <li>ICS 파일을 다운로드합니다.</li>
              <li>파일을 탭/클릭하면 캘린더 앱이 자동으로 열립니다.</li>
              <li>&quot;추가&quot; 또는 &quot;일정 추가&quot;를 선택합니다.</li>
            </ol>
          </div>

          {/* Google Calendar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3z"
                />
              </svg>
              Google Calendar
            </div>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-6">
              <li>calendar.google.com에 접속합니다.</li>
              <li>좌측 메뉴에서 &quot;+&quot; 버튼 → &quot;가져오기&quot;를 선택합니다.</li>
              <li>다운로드한 ICS 파일을 업로드합니다.</li>
              <li>&quot;가져오기&quot; 버튼을 클릭합니다.</li>
            </ol>
          </div>

          {/* Outlook */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Monitor className="h-4 w-4" />
              Outlook Calendar
            </div>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-6">
              <li>outlook.live.com 또는 Outlook 앱에서 캘린더를 엽니다.</li>
              <li>&quot;일정 추가&quot; → &quot;파일에서 업로드&quot;를 선택합니다.</li>
              <li>다운로드한 ICS 파일을 선택합니다.</li>
              <li>&quot;가져오기&quot;를 클릭합니다.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* 향후 기능: 캘린더 구독 */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5" />
            캘린더 구독 (준비 중)
          </CardTitle>
          <CardDescription>
            캘린더 구독 URL을 통해 예약이 자동으로 동기화됩니다.
            이 기능은 곧 제공될 예정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={subscriptionUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              disabled
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copySubscriptionUrl}
              disabled
            >
              {copied ? "복사됨!" : "URL 복사"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * 이 기능이 활성화되면 캘린더 앱에서 URL을 구독하여
            새로운 예약이 자동으로 동기화됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
