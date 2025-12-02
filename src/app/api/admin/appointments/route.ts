import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 관리자 권한 확인
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as AppointmentStatus | null;

    const where: Prisma.AppointmentWhereInput = status ? { status } : {};

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        counselor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Admin appointments error:", error);
    return NextResponse.json({ error: "예약 목록 조회에 실패했습니다." }, { status: 500 });
  }
}
