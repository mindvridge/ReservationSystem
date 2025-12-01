import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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
    const { counselorId, date, isAvailable, startTime, endTime, reason } = body;

    // 상담사 확인
    const counselor = await prisma.counselor.findUnique({
      where: { id: counselorId, userId },
    });

    if (!counselor) {
      return NextResponse.json(
        { error: "상담사 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 예외 일정 생성 또는 업데이트
    const exception = await prisma.scheduleException.upsert({
      where: {
        counselorId_date: {
          counselorId,
          date: new Date(date),
        },
      },
      update: {
        isAvailable,
        startTime,
        endTime,
        reason,
      },
      create: {
        counselorId,
        date: new Date(date),
        isAvailable,
        startTime,
        endTime,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      exception,
    });
  } catch (error) {
    console.error("Error saving exception:", error);
    return NextResponse.json(
      { error: "예외 일정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
