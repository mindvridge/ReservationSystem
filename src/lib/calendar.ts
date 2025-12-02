// ICS 파일 생성 유틸리티
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
}

// 날짜를 ICS 형식으로 변환 (YYYYMMDDTHHMMSSZ)
function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// 특수 문자 이스케이프
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// 단일 이벤트를 ICS 형식으로 변환
export function eventToICS(event: CalendarEvent): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${event.id}@counseling-reservation.com`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${formatDateToICS(event.startTime)}`,
    `DTEND:${formatDateToICS(event.endTime)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  if (event.organizer) {
    lines.push(
      `ORGANIZER;CN=${escapeICSText(event.organizer.name)}:mailto:${event.organizer.email}`
    );
  }

  if (event.attendees) {
    for (const attendee of event.attendees) {
      lines.push(
        `ATTENDEE;CN=${escapeICSText(attendee.name)}:mailto:${attendee.email}`
      );
    }
  }

  lines.push("STATUS:CONFIRMED");
  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

// 여러 이벤트를 ICS 캘린더로 변환
export function eventsToICSCalendar(
  events: CalendarEvent[],
  calendarName: string = "상담 예약"
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Counseling Reservation//NONSGML v1.0//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    "X-WR-TIMEZONE:Asia/Seoul",
  ].join("\r\n");

  const eventStrings = events.map(eventToICS).join("\r\n");
  const footer = "END:VCALENDAR";

  return `${header}\r\n${eventStrings}\r\n${footer}`;
}

// 예약 데이터를 캘린더 이벤트로 변환
export function appointmentToCalendarEvent(appointment: {
  id: string;
  startTime: Date;
  endTime: Date;
  counselorName: string;
  counselorEmail?: string;
  clientName: string;
  clientEmail?: string;
  notes?: string;
  sessionType?: string;
}): CalendarEvent {
  const sessionTypeText =
    appointment.sessionType === "VIDEO" ? "화상 상담" :
    appointment.sessionType === "PHONE" ? "전화 상담" :
    appointment.sessionType === "IN_PERSON" ? "대면 상담" : "상담";

  return {
    id: appointment.id,
    title: `${sessionTypeText} - ${appointment.counselorName} 상담사`,
    description: appointment.notes
      ? `상담 노트: ${appointment.notes}`
      : `${appointment.counselorName} 상담사와의 ${sessionTypeText} 예약입니다.`,
    startTime: new Date(appointment.startTime),
    endTime: new Date(appointment.endTime),
    organizer: appointment.counselorEmail
      ? { name: appointment.counselorName, email: appointment.counselorEmail }
      : undefined,
    attendees: appointment.clientEmail
      ? [{ name: appointment.clientName, email: appointment.clientEmail }]
      : undefined,
  };
}

// Google Calendar URL 생성
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatDateToICS(event.startTime)}/${formatDateToICS(event.endTime)}`,
    details: event.description || "",
    location: event.location || "",
  });

  return `${baseUrl}?${params.toString()}`;
}

// Outlook Calendar URL 생성
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://outlook.live.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    subject: event.title,
    body: event.description || "",
    location: event.location || "",
  });

  return `${baseUrl}?${params.toString()}`;
}

// Yahoo Calendar URL 생성
export function generateYahooCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://calendar.yahoo.com/";

  // Yahoo는 duration을 분 단위로 필요로 함
  const durationMinutes = Math.round(
    (event.endTime.getTime() - event.startTime.getTime()) / 60000
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const duration = `${hours.toString().padStart(2, "0")}${minutes.toString().padStart(2, "0")}`;

  const params = new URLSearchParams({
    v: "60",
    title: event.title,
    st: formatDateToICS(event.startTime),
    dur: duration,
    desc: event.description || "",
    in_loc: event.location || "",
  });

  return `${baseUrl}?${params.toString()}`;
}

// 모든 캘린더 링크 생성
export function generateCalendarLinks(event: CalendarEvent) {
  return {
    google: generateGoogleCalendarUrl(event),
    outlook: generateOutlookCalendarUrl(event),
    yahoo: generateYahooCalendarUrl(event),
  };
}
