import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  appointmentToCalendarEvent,
  generateCalendarLinks,
} from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { appointmentId } = await params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [{ clientId: userId }, { counselor: { userId } }],
      },
      include: {
        counselor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        client: {
          select: { name: true, email: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const event = appointmentToCalendarEvent({
      id: appointment.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      counselorName: appointment.counselor.user.name || "상담사",
      counselorEmail: appointment.counselor.user.email,
      clientName: appointment.client.name || "내담자",
      clientEmail: appointment.client.email,
      notes: appointment.notes || undefined,
      sessionType: appointment.sessionType || undefined,
    });

    const links = generateCalendarLinks(event);

    // ICS 다운로드 링크도 추가
    const icsLink = `/api/calendar/export?appointmentId=${appointmentId}`;

    return NextResponse.json({
      links: {
        ...links,
        ics: icsLink,
        apple: icsLink, // Apple Calendar도 ICS 파일 사용
      },
      event: {
        title: event.title,
        description: event.description,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
      },
    });
  } catch (error) {
    console.error("Calendar links error:", error);
    return NextResponse.json(
      { error: "캘린더 링크 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
