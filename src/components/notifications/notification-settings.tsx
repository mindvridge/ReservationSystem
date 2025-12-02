"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, BellRing, AlertCircle, CheckCircle } from "lucide-react";
import { usePushNotification } from "@/hooks/use-push-notification";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotification();

  const [testSent, setTestSent] = useState(false);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error("Toggle notification error:", error);
      alert("알림 설정 변경에 실패했습니다.");
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error("Test notification error:", error);
      alert("테스트 알림 전송에 실패했습니다.");
    }
  };

  // 브라우저 미지원
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            푸시 알림
          </CardTitle>
          <CardDescription>
            이 브라우저는 푸시 알림을 지원하지 않습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Chrome, Firefox, Safari 등 최신 브라우저를 사용해주세요.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>푸시 알림</CardTitle>
          </div>
          <Badge
            variant={permission === "granted" ? "default" : "secondary"}
            className={cn(
              permission === "granted" && "bg-green-500",
              permission === "denied" && "bg-red-500"
            )}
          >
            {permission === "granted" && "허용됨"}
            {permission === "denied" && "차단됨"}
            {permission === "default" && "미설정"}
          </Badge>
        </div>
        <CardDescription>
          예약 확인, 리마인더 등 중요한 알림을 받으세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission === "denied" ? (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                알림이 차단되었습니다
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                브라우저 설정에서 이 사이트의 알림을 허용해주세요.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">알림 받기</Label>
                <p className="text-sm text-muted-foreground">
                  브라우저 푸시 알림을 활성화합니다.
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={isLoading}
              />
            </div>

            {isSubscribed && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">알림이 활성화되었습니다.</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">테스트 알림</p>
                    <p className="text-xs text-muted-foreground">
                      알림이 제대로 작동하는지 확인합니다.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotification}
                    disabled={testSent}
                  >
                    {testSent ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        전송됨
                      </>
                    ) : (
                      <>
                        <BellRing className="h-4 w-4 mr-1" />
                        테스트
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-xs text-muted-foreground pt-4 border-t">
          <p>알림 종류:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>예약 확정 알림</li>
            <li>예약 취소 알림</li>
            <li>24시간 전 리마인더</li>
            <li>1시간 전 리마인더</li>
            <li>새 메시지 알림</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
