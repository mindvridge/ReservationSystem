import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  eventsToICSCalendar,
  appointmentToCalendarEvent,
} from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get("appointmentId");
    const type = searchParams.get("type") || "all"; // all, upcoming, past

    // 단일 예약 내보내기
    if (appointmentId) {
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

      const icsContent = eventsToICSCalendar([event], "상담 예약");

      return new NextResponse(icsContent, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="appointment-${appointment.id}.ics"`,
        },
      });
    }

    // 여러 예약 내보내기
    const now = new Date();
    const whereClause: Record<string, unknown> = {
      OR: [{ clientId: userId }, { counselor: { userId } }],
      status: { in: ["CONFIRMED", "PENDING"] },
    };

    if (type === "upcoming") {
      whereClause.startTime = { gte: now };
    } else if (type === "past") {
      whereClause.startTime = { lt: now };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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
      orderBy: { startTime: "asc" },
    });

    if (appointments.length === 0) {
      return NextResponse.json(
        { error: "내보낼 예약이 없습니다." },
        { status: 404 }
      );
    }

    const events = appointments.map((appointment) =>
      appointmentToCalendarEvent({
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        counselorName: appointment.counselor.user.name || "상담사",
        counselorEmail: appointment.counselor.user.email,
        clientName: appointment.client.name || "내담자",
        clientEmail: appointment.client.email,
        notes: appointment.notes || undefined,
        sessionType: appointment.sessionType || undefined,
      })
    );

    const calendarName =
      type === "upcoming"
        ? "예정된 상담 예약"
        : type === "past"
        ? "지난 상담 예약"
        : "모든 상담 예약";

    const icsContent = eventsToICSCalendar(events, calendarName);

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="counseling-appointments-${type}.ics"`,
      },
    });
  } catch (error) {
    console.error("Calendar export error:", error);
    return NextResponse.json(
      { error: "캘린더 내보내기에 실패했습니다." },
      { status: 500 }
    );
  }
}
