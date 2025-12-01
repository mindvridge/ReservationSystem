import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendBookingCancellation } from "@/lib/notifications";

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

    // 예약 정보 조회
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        counselor: {
          include: {
            user: true,
          },
        },
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인 (본인 예약 또는 상담사)
    const counselor = await prisma.counselor.findUnique({
      where: { userId },
    });

    const isClient = appointment.clientId === userId;
    const isCounselor = counselor && appointment.counselorId === counselor.id;

    if (!isClient && !isCounselor) {
      return NextResponse.json(
        { error: "취소 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 이미 취소된 예약인지 확인
    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "이미 취소된 예약입니다." },
        { status: 400 }
      );
    }

    // 완료된 예약은 취소 불가
    if (appointment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "완료된 예약은 취소할 수 없습니다." },
        { status: 400 }
      );
    }

    // 24시간 이내 예약은 취소 불가 (클라이언트만 해당)
    const now = new Date();
    const hoursBefore = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isClient && hoursBefore < 24) {
      return NextResponse.json(
        { error: "상담 24시간 전부터는 취소가 불가능합니다. 상담사에게 직접 연락해주세요." },
        { status: 400 }
      );
    }

    // 예약 취소
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: isClient ? "내담자 취소" : "상담사 취소",
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

    // 취소 알림 발송
    try {
      await sendBookingCancellation(updatedAppointment);
    } catch (notificationError) {
      console.error("취소 알림 발송 실패:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "예약이 취소되었습니다.",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "예약 취소에 실패했습니다." },
      { status: 500 }
    );
  }
}
