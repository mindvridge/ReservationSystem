import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: counselorId } = await params;

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

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "유효하지 않은 상태값입니다." }, { status: 400 });
    }

    const updatedCounselor = await prisma.counselor.update({
      where: { id: counselorId },
      data: { isActive },
    });

    return NextResponse.json({ counselor: updatedCounselor });
  } catch (error) {
    console.error("Update counselor status error:", error);
    return NextResponse.json({ error: "상태 변경에 실패했습니다." }, { status: 500 });
  }
}
