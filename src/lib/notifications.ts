import { prisma } from "./prisma";
import { formatDateKST, formatTimeKST } from "./datetime";
import { formatPrice } from "./utils";

// Web3Forms API
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || "";

interface AppointmentWithDetails {
  id: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: string;
  counselor: {
    user: {
      name: string | null;
      email: string;
    };
    sessionDuration: number;
  };
  client: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

// 예약 확정 알림 발송
export async function sendBookingConfirmation(appointment: AppointmentWithDetails) {
  if (appointment.client.email) {
    await sendEmailNotification(appointment, "BOOKING_CONFIRMATION");
  }
}

// 예약 취소 알림 발송
export async function sendBookingCancellation(appointment: AppointmentWithDetails) {
  if (appointment.client.email) {
    await sendEmailNotification(appointment, "BOOKING_CANCELLED");
  }
}

// 리마인더 알림 발송
export async function sendReminder(
  appointment: AppointmentWithDetails,
  type: "REMINDER_24H" | "REMINDER_1H"
) {
  if (appointment.client.email) {
    await sendEmailNotification(appointment, type);
  }
}

// 이메일 알림 발송 (Web3Forms)
async function sendEmailNotification(
  appointment: AppointmentWithDetails,
  type: "BOOKING_CONFIRMATION" | "BOOKING_CANCELLED" | "REMINDER_24H" | "REMINDER_1H"
) {
  const { subject, html } = getEmailContent(appointment, type);

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: subject,
        from_name: "심리상담 예약 시스템",
        email: appointment.client.email,
        message: html,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Web3Forms submission failed");
    }

    // 알림 기록 저장
    await prisma.notification.create({
      data: {
        userId: appointment.client.id,
        appointmentId: appointment.id,
        type,
        channel: "EMAIL",
        recipient: appointment.client.email,
        content: html,
        sentAt: new Date(),
        isSuccess: true,
      },
    });
  } catch (error) {
    console.error("Email notification failed:", error);

    await prisma.notification.create({
      data: {
        userId: appointment.client.id,
        appointmentId: appointment.id,
        type,
        channel: "EMAIL",
        recipient: appointment.client.email,
        content: html,
        isSuccess: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}

// 이메일 콘텐츠 생성
function getEmailContent(
  appointment: AppointmentWithDetails,
  type: "BOOKING_CONFIRMATION" | "BOOKING_CANCELLED" | "REMINDER_24H" | "REMINDER_1H"
): { subject: string; html: string } {
  const clientName = appointment.client.name || "고객";
  const counselorName = appointment.counselor.user.name || "상담사";
  const dateStr = formatDateKST(appointment.startTime, "yyyy년 M월 d일 (EEEE)");
  const timeStr = formatTimeKST(appointment.startTime);
  const duration = appointment.counselor.sessionDuration;
  const price = formatPrice(appointment.price);

  switch (type) {
    case "BOOKING_CONFIRMATION":
      return {
        subject: "[심리상담 예약] 예약이 확정되었습니다",
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">예약 확정 안내</h1>

            <p>${clientName}님, 안녕하세요.</p>
            <p>심리상담 예약이 확정되었습니다.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">예약 정보</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">상담사</td>
                  <td style="padding: 8px 0; font-weight: bold;">${counselorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">일시</td>
                  <td style="padding: 8px 0; font-weight: bold;">${dateStr} ${timeStr}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">상담 시간</td>
                  <td style="padding: 8px 0; font-weight: bold;">${duration}분</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">상담 비용</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #3b82f6;">${price}</td>
                </tr>
              </table>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              * 예약 취소는 상담 24시간 전까지 가능합니다.<br>
              * 문의사항이 있으시면 고객센터로 연락해 주세요.
            </p>

            <p style="margin-top: 30px;">감사합니다.<br><strong>심리상담 예약 시스템</strong></p>
          </div>
        `,
      };

    case "BOOKING_CANCELLED":
      return {
        subject: "[심리상담 예약] 예약이 취소되었습니다",
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">예약 취소 안내</h1>

            <p>${clientName}님, 안녕하세요.</p>
            <p>아래 예약이 취소되었습니다.</p>

            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>상담사:</strong> ${counselorName}</p>
              <p><strong>일시:</strong> ${dateStr} ${timeStr}</p>
            </div>

            <p>새로운 상담 예약을 원하시면 홈페이지를 방문해 주세요.</p>

            <p style="margin-top: 30px;">감사합니다.<br><strong>심리상담 예약 시스템</strong></p>
          </div>
        `,
      };

    case "REMINDER_24H":
      return {
        subject: "[심리상담 예약] 내일 상담 예정 안내",
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">상담 일정 리마인더</h1>

            <p>${clientName}님, 안녕하세요.</p>
            <p>내일 예정된 상담이 있습니다.</p>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>상담사:</strong> ${counselorName}</p>
              <p><strong>일시:</strong> ${dateStr} ${timeStr}</p>
              <p><strong>상담 시간:</strong> ${duration}분</p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              * 취소가 필요하시면 오늘 중으로 연락해 주세요.
            </p>

            <p style="margin-top: 30px;">감사합니다.<br><strong>심리상담 예약 시스템</strong></p>
          </div>
        `,
      };

    case "REMINDER_1H":
      return {
        subject: "[심리상담 예약] 1시간 후 상담 예정",
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">상담 시작 안내</h1>

            <p>${clientName}님, 안녕하세요.</p>
            <p><strong>1시간 후</strong> 상담이 시작됩니다.</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>상담사:</strong> ${counselorName}</p>
              <p><strong>시간:</strong> ${timeStr}</p>
            </div>

            <p>상담 준비를 부탁드립니다.</p>

            <p style="margin-top: 30px;">감사합니다.<br><strong>심리상담 예약 시스템</strong></p>
          </div>
        `,
      };
  }
}
