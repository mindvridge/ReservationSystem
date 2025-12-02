import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 메시지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json({ error: "상대방 ID가 필요합니다." }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: participantId },
          { senderId: participantId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "메시지 조회에 실패했습니다." }, { status: 500 });
  }
}

// 메시지 전송
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: "수신자 ID와 메시지 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // 메시지 생성
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "메시지 전송에 실패했습니다." }, { status: 500 });
  }
}
