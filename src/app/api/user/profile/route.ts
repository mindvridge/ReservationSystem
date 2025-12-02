import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 프로필 조회
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json({ error: "프로필 조회에 실패했습니다." }, { status: 500 });
  }
}

// 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, onboardingCompleted } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        onboardingCompleted: onboardingCompleted ?? undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json({ error: "프로필 업데이트에 실패했습니다." }, { status: 500 });
  }
}
