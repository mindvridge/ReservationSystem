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

    // 내가 보낸 메시지와 받은 메시지의 상대방 목록 조회
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ["receiverId"],
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ["senderId"],
    });

    // 대화 상대 ID 목록
    const participantIds = new Set([
      ...sentMessages.map((m) => m.receiverId),
      ...receivedMessages.map((m) => m.senderId),
    ]);

    // 각 상대방과의 대화 정보 조회
    const conversations = await Promise.all(
      Array.from(participantIds).map(async (participantId) => {
        // 상대방 정보
        const participant = await prisma.user.findUnique({
          where: { id: participantId },
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        });

        if (!participant) return null;

        // 마지막 메시지
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: participantId },
              { senderId: participantId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        // 읽지 않은 메시지 수
        const unreadCount = await prisma.message.count({
          where: {
            senderId: participantId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          id: `${userId}-${participantId}`,
          participantId: participant.id,
          participantName: participant.name || "이름 없음",
          participantImage: participant.profileImage,
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.createdAt.toISOString() || new Date().toISOString(),
          unreadCount,
        };
      })
    );

    // null 제거하고 최신 메시지 순으로 정렬
    const validConversations = conversations
      .filter((c) => c !== null)
      .sort((a, b) => new Date(b!.lastMessageAt).getTime() - new Date(a!.lastMessageAt).getTime());

    return NextResponse.json({ conversations: validConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json({ error: "대화 목록 조회에 실패했습니다." }, { status: 500 });
  }
}
