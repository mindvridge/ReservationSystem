import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CounselorCalendar } from "@/components/counselor/counselor-calendar";
import { AppointmentList } from "@/components/dashboard/appointment-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Clock, DollarSign } from "lucide-react";

async function getCounselorData(userId: string) {
  const counselor = await prisma.counselor.findUnique({
    where: { userId },
    include: {
      user: true,
      schedules: true,
      scheduleExceptions: true,
    },
  });

  return counselor;
}

async function getAppointmentStats(counselorId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayCount, weekCount, monthlyRevenue, totalClients] = await Promise.all([
    // 오늘 예약 수
    prisma.appointment.count({
      where: {
        counselorId,
        startTime: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
          lt: new Date(now.setHours(23, 59, 59, 999)),
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    // 이번 주 예약 수
    prisma.appointment.count({
      where: {
        counselorId,
        startTime: {
          gte: new Date(now.setDate(now.getDate() - now.getDay())),
          lt: new Date(now.setDate(now.getDate() - now.getDay() + 7)),
        },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
    }),
    // 이번 달 수익
    prisma.appointment.aggregate({
      where: {
        counselorId,
        startTime: { gte: startOfMonth },
        status: "COMPLETED",
      },
      _sum: { price: true },
    }),
    // 총 내담자 수
    prisma.appointment.groupBy({
      by: ["clientId"],
      where: { counselorId },
    }),
  ]);

  return {
    todayCount,
    weekCount,
    monthlyRevenue: monthlyRevenue._sum.price || 0,
    totalClients: totalClients.length,
  };
}

async function getUpcomingAppointments(counselorId: string) {
  return prisma.appointment.findMany({
    where: {
      counselorId,
      startTime: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
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
      client: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
    take: 10,
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[500px]" />
    </div>
  );
}

async function CounselorDashboardContent() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const counselor = await getCounselorData(userId);

  if (!counselor) {
    redirect("/counselor/register");
  }

  const [stats, upcomingAppointments] = await Promise.all([
    getAppointmentStats(counselor.id),
    getUpcomingAppointments(counselor.id),
  ]);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 상담</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 주 상담</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekCount}</div>
            <p className="text-xs text-muted-foreground">건</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 수익</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("ko-KR").format(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">원</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 내담자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">명</p>
          </CardContent>
        </Card>
      </div>

      {/* 캘린더 */}
      <Card>
        <CardHeader>
          <CardTitle>상담 일정</CardTitle>
        </CardHeader>
        <CardContent>
          <CounselorCalendar counselorId={counselor.id} />
        </CardContent>
      </Card>

      {/* 예정된 상담 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>예정된 상담</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentList
            appointments={upcomingAppointments}
            type="upcoming"
            role="counselor"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CounselorDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">상담 관리</h1>
        <p className="text-muted-foreground">상담 일정을 확인하고 관리하세요.</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <CounselorDashboardContent />
      </Suspense>
    </div>
  );
}
