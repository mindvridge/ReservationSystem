import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const appointmentId = params.id;

    // 상담사 확인
    const counselor = await prisma.counselor.findUnique({
      where: { userId },
    });

    if (!counselor) {
      return NextResponse.json(
        { error: "상담사 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 예약 정보 조회
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 예약인지 확인
    if (appointment.counselorId !== counselor.id) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 상태 확인
    if (appointment.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "확정된 예약만 완료 처리할 수 있습니다." },
        { status: 400 }
      );
    }

    // 예약 완료 처리
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({
      success: true,
      message: "상담이 완료 처리되었습니다.",
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    return NextResponse.json(
      { error: "상담 완료 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
