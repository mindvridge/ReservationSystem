import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "사용자 목록 조회에 실패했습니다." }, { status: 500 });
  }
}
