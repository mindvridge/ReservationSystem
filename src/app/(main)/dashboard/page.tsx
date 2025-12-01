import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentList } from "@/components/dashboard/appointment-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, CheckCircle } from "lucide-react";

async function getAppointmentStats(userId: string) {
  const now = new Date();

  const [upcoming, completed, total] = await Promise.all([
    prisma.appointment.count({
      where: {
        clientId: userId,
        startTime: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.appointment.count({
      where: {
        clientId: userId,
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        clientId: userId,
      },
    }),
  ]);

  return { upcoming, completed, total };
}

async function getAppointments(userId: string, type: "upcoming" | "past") {
  const now = new Date();

  return prisma.appointment.findMany({
    where: {
      clientId: userId,
      ...(type === "upcoming"
        ? {
            startTime: { gte: now },
            status: { in: ["PENDING", "CONFIRMED"] },
          }
        : {
            OR: [
              { startTime: { lt: now } },
              { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
            ],
          }),
    },
    include: {
      counselor: {
        include: {
          user: {
            select: {
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: type === "upcoming" ? "asc" : "desc",
    },
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

async function DashboardContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 사용자 정보 동기화
  await syncUserFromClerk();

  const [stats, upcomingAppointments, pastAppointments] = await Promise.all([
    getAppointmentStats(userId),
    getAppointments(userId, "upcoming"),
    getAppointments(userId, "past"),
  ]);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예정된 상담</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료된 상담</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예약</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>
      </div>

      {/* 예약 목록 */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="upcoming">예정된 상담</TabsTrigger>
          <TabsTrigger value="past">지난 상담</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>예정된 상담</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                appointments={upcomingAppointments}
                type="upcoming"
                role="client"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>지난 상담</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentList
                appointments={pastAppointments}
                type="past"
                role="client"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">내 예약</h1>
        <p className="text-muted-foreground">예약 현황을 확인하고 관리하세요.</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
