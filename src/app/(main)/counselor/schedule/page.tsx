import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyScheduleForm } from "@/components/counselor/weekly-schedule-form";
import { ExceptionScheduleList } from "@/components/counselor/exception-schedule-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getCounselorData(userId: string) {
  const counselor = await prisma.counselor.findUnique({
    where: { userId },
    include: {
      schedules: {
        orderBy: { dayOfWeek: "asc" },
      },
      scheduleExceptions: {
        where: {
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  return counselor;
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}

async function ScheduleContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const counselor = await getCounselorData(userId);

  if (!counselor) {
    redirect("/counselor/register");
  }

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
        <TabsTrigger value="weekly">주간 일정</TabsTrigger>
        <TabsTrigger value="exceptions">예외 설정</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        <Card>
          <CardHeader>
            <CardTitle>주간 가용 시간 설정</CardTitle>
            <CardDescription>
              상담 가능한 요일과 시간을 설정하세요. 내담자는 이 시간 내에서만 예약할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyScheduleForm
              counselorId={counselor.id}
              schedules={counselor.schedules}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="exceptions">
        <Card>
          <CardHeader>
            <CardTitle>날짜별 예외 설정</CardTitle>
            <CardDescription>
              휴가나 특별 가용 시간 등 특정 날짜의 예외 일정을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExceptionScheduleList
              counselorId={counselor.id}
              exceptions={counselor.scheduleExceptions}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function CounselorSchedulePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">일정 설정</h1>
        <p className="text-muted-foreground">
          상담 가능 시간을 설정하고 관리하세요.
        </p>
      </div>

      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
