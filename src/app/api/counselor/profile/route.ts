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

    const counselor = await prisma.counselor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    if (!counselor) {
      return NextResponse.json({ error: "상담사 프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(counselor);
  } catch (error) {
    console.error("Get counselor profile error:", error);
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

    const counselor = await prisma.counselor.findUnique({
      where: { userId },
    });

    if (!counselor) {
      return NextResponse.json({ error: "상담사 프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await request.json();
    const { bio, specialties, sessionDuration, sessionPrice, name, phone } = body;

    // 유효성 검사
    if (!bio || bio.length < 20) {
      return NextResponse.json(
        { error: "자기소개는 최소 20자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    if (!specialties || specialties.length === 0) {
      return NextResponse.json(
        { error: "최소 1개 이상의 전문분야를 선택해주세요." },
        { status: 400 }
      );
    }

    if (sessionDuration < 30 || sessionDuration > 120) {
      return NextResponse.json(
        { error: "상담 시간은 30분에서 120분 사이여야 합니다." },
        { status: 400 }
      );
    }

    if (sessionPrice < 10000 || sessionPrice > 500000) {
      return NextResponse.json(
        { error: "상담 비용은 10,000원에서 500,000원 사이여야 합니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 업데이트
    const updatedCounselor = await prisma.$transaction(async (tx) => {
      // 사용자 정보 업데이트
      await tx.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          phone: phone || undefined,
        },
      });

      // 상담사 정보 업데이트
      return tx.counselor.update({
        where: { userId },
        data: {
          bio,
          specialties,
          sessionDuration,
          sessionPrice,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedCounselor);
  } catch (error) {
    console.error("Update counselor profile error:", error);
    return NextResponse.json({ error: "프로필 업데이트에 실패했습니다." }, { status: 500 });
  }
}
