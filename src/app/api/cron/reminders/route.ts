import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/lib/notifications";
import { addHours } from "date-fns";

export const dynamic = "force-dynamic";

// 이 API는 크론 작업으로 주기적으로 호출됩니다.
// Vercel: vercel.json에서 cron 설정
// 또는 외부 크론 서비스 (cron-job.org 등) 사용

export async function GET(request: NextRequest) {
  try {
    // 크론 시크릿 검증 (보안)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // 24시간 리마인더: 23-25시간 후 상담 예정
    const reminder24hStart = addHours(now, 23);
    const reminder24hEnd = addHours(now, 25);

    const appointments24h = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: reminder24hStart,
          lte: reminder24hEnd,
        },
        status: "CONFIRMED",
        reminder24hSent: false,
      },
      include: {
        counselor: {
          include: {
            user: true,
          },
        },
        client: true,
      },
    });

    // 1시간 리마인더: 50분-70분 후 상담 예정
    const reminder1hStart = addHours(now, 50 / 60);
    const reminder1hEnd = addHours(now, 70 / 60);

    const appointments1h = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: reminder1hStart,
          lte: reminder1hEnd,
        },
        status: "CONFIRMED",
        reminder1hSent: false,
      },
      include: {
        counselor: {
          include: {
            user: true,
          },
        },
        client: true,
      },
    });

    let sent24h = 0;
    let sent1h = 0;

    // 24시간 리마인더 발송
    for (const appointment of appointments24h) {
      try {
        await sendReminder(appointment, "REMINDER_24H");
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminder24hSent: true },
        });
        sent24h++;
      } catch (error) {
        console.error(`24h reminder failed for ${appointment.id}:`, error);
      }
    }

    // 1시간 리마인더 발송
    for (const appointment of appointments1h) {
      try {
        await sendReminder(appointment, "REMINDER_1H");
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminder1hSent: true },
        });
        sent1h++;
      } catch (error) {
        console.error(`1h reminder failed for ${appointment.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sent: {
        reminder24h: sent24h,
        reminder1h: sent1h,
      },
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "리마인더 발송에 실패했습니다." },
      { status: 500 }
    );
  }
}
