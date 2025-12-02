import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: "상대방 ID가 필요합니다." }, { status: 400 });
    }

    // 해당 상대방이 보낸 메시지 읽음 처리
    await prisma.message.updateMany({
      where: {
        senderId: participantId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark messages read error:", error);
    return NextResponse.json({ error: "읽음 처리에 실패했습니다." }, { status: 500 });
  }
}
