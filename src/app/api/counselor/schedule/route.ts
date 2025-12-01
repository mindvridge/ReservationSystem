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
    const { counselorId, schedules } = body;

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

    // 트랜잭션으로 일정 업데이트
    await prisma.$transaction(async (tx) => {
      for (const schedule of schedules) {
        const { dayOfWeek, isActive, startTime, endTime } = schedule;

        await tx.weeklySchedule.upsert({
          where: {
            counselorId_dayOfWeek: {
              counselorId,
              dayOfWeek,
            },
          },
          update: {
            isActive,
            startTime,
            endTime,
          },
          create: {
            counselorId,
            dayOfWeek,
            isActive,
            startTime,
            endTime,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "일정이 저장되었습니다.",
    });
  } catch (error) {
    console.error("Error saving schedule:", error);
    return NextResponse.json(
      { error: "일정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
