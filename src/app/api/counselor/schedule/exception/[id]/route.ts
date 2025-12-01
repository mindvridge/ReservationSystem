import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

    const exceptionId = params.id;

    // 예외 정보 조회
    const exception = await prisma.scheduleException.findUnique({
      where: { id: exceptionId },
      include: {
        counselor: true,
      },
    });

    if (!exception) {
      return NextResponse.json(
        { error: "예외 일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인
    if (exception.counselor.userId !== userId) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 삭제
    await prisma.scheduleException.delete({
      where: { id: exceptionId },
    });

    return NextResponse.json({
      success: true,
      message: "예외 일정이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting exception:", error);
    return NextResponse.json(
      { error: "예외 일정 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
