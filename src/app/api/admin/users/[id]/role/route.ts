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
    const { id: targetUserId } = await params;

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
    const { role } = body;

    if (!["CLIENT", "COUNSELOR", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
    }

    // 사용자 역할 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    // 상담사로 변경 시 상담사 프로필 생성
    if (role === "COUNSELOR") {
      const existingCounselor = await prisma.counselor.findUnique({
        where: { userId: targetUserId },
      });

      if (!existingCounselor) {
        await prisma.counselor.create({
          data: {
            userId: targetUserId,
            bio: "",
            specialties: [],
            sessionDuration: 50,
            sessionPrice: 100000,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json({ error: "역할 변경에 실패했습니다." }, { status: 500 });
  }
}
