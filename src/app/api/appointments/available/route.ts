import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDayKST, endOfDayKST, formatTimeKST } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const counselorId = searchParams.get("counselorId");
    const date = searchParams.get("date"); // YYYY-MM-DD 형식

    if (!counselorId || !date) {
      return NextResponse.json(
        { error: "counselorId와 date가 필요합니다." },
        { status: 400 }
      );
    }

    // 해당 날짜의 시작과 끝 (KST 기준으로 계산 후 UTC로 변환)
    const dateObj = new Date(date + "T00:00:00");
    const dayStart = startOfDayKST(dateObj);
    const dayEnd = endOfDayKST(dateObj);

    // 해당 날짜에 예약된 시간 조회
    const appointments = await prisma.appointment.findMany({
      where: {
        counselorId,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        startTime: true,
      },
    });

    // 예약된 시간을 KST 형식으로 변환
    const bookedSlots = appointments.map((apt) =>
      formatTimeKST(apt.startTime)
    );

    // 날짜별 예외 설정 확인
    const exception = await prisma.scheduleException.findUnique({
      where: {
        counselorId_date: {
          counselorId,
          date: new Date(date),
        },
      },
    });

    // 예외가 있고 가용 불가인 경우
    if (exception && !exception.isAvailable) {
      return NextResponse.json({
        bookedSlots: [],
        isBlocked: true,
        reason: exception.reason,
      });
    }

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "가용 시간 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
