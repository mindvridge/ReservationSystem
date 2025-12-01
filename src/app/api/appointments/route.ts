import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createUTCDateTime, calculateEndTime, formatDateTimeKST } from "@/lib/datetime";
import { sendBookingConfirmation } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { counselorId, date, time, notes } = body;

    if (!counselorId || !date || !time) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 상담사 정보 조회
    const counselor = await prisma.counselor.findUnique({
      where: { id: counselorId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!counselor) {
      return NextResponse.json(
        { error: "상담사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 정보 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 예약 시간 계산 (KST -> UTC)
    const startTime = createUTCDateTime(date, time);
    const endTime = calculateEndTime(startTime, counselor.sessionDuration);

    // 과거 시간 예약 방지
    if (startTime <= new Date()) {
      return NextResponse.json(
        { error: "과거 시간에는 예약할 수 없습니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 더블 부킹 방지
    const appointment = await prisma.$transaction(async (tx) => {
      // 해당 시간에 이미 예약이 있는지 확인 (비관적 잠금)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          counselorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            // 새 예약 시작 시간이 기존 예약 시간 범위 내에 있는 경우
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            // 새 예약 종료 시간이 기존 예약 시간 범위 내에 있는 경우
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            // 새 예약이 기존 예약을 완전히 포함하는 경우
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });

      if (existingAppointment) {
        throw new Error("해당 시간에 이미 예약이 있습니다.");
      }

      // 날짜별 예외 확인
      const exception = await tx.scheduleException.findUnique({
        where: {
          counselorId_date: {
            counselorId,
            date: new Date(date),
          },
        },
      });

      if (exception && !exception.isAvailable) {
        throw new Error("해당 날짜는 상담이 불가능합니다.");
      }

      // 예약 생성
      const newAppointment = await tx.appointment.create({
        data: {
          counselorId,
          clientId: userId,
          startTime,
          endTime,
          price: counselor.sessionPrice,
          notes,
          status: "CONFIRMED", // 자동 확정 (결제 시스템 연동 시 PENDING으로 변경)
        },
        include: {
          counselor: {
            include: {
              user: true,
            },
          },
          client: true,
        },
      });

      return newAppointment;
    });

    // 알림 발송 (비동기 - 실패해도 예약은 유지)
    try {
      await sendBookingConfirmation(appointment);
    } catch (notificationError) {
      console.error("알림 발송 실패:", notificationError);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        startTime: formatDateTimeKST(appointment.startTime),
        endTime: formatDateTimeKST(appointment.endTime),
        counselorName: appointment.counselor.user.name,
        status: appointment.status,
      },
    });
  } catch (error) {
    console.error("Error creating appointment:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "예약 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

// 예약 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role"); // client 또는 counselor
    const status = searchParams.get("status");

    let whereClause: Record<string, unknown> = {};

    if (role === "counselor") {
      // 상담사의 예약 목록
      const counselor = await prisma.counselor.findUnique({
        where: { userId },
      });

      if (!counselor) {
        return NextResponse.json(
          { error: "상담사 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      whereClause.counselorId = counselor.id;
    } else {
      // 내담자의 예약 목록
      whereClause.clientId = userId;
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "예약 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
