import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [
      totalUsers,
      totalCounselors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.counselor.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.appointment.count({
        where: {
          startTime: { gte: todayStart, lte: todayEnd },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.appointment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { price: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalCounselors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments,
      totalRevenue: revenueResult._sum.price || 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "통계 조회에 실패했습니다." }, { status: 500 });
  }
}
