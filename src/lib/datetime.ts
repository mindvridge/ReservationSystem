import { format, parseISO, addMinutes, addHours, startOfDay, endOfDay, getDay, isBefore, isSameDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Seoul";

// UTC를 KST로 변환
export function toKST(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, TIMEZONE);
}

// KST를 UTC로 변환
export function toUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return fromZonedTime(d, TIMEZONE);
}

// 현재 시간 (KST)
export function nowKST(): Date {
  return toKST(new Date());
}

// 날짜 포맷 (KST 기준)
export function formatDateKST(date: Date | string, formatStr: string = "yyyy-MM-dd"): string {
  const kstDate = toKST(date);
  return format(kstDate, formatStr);
}

// 시간 포맷 (KST 기준)
export function formatTimeKST(date: Date | string, formatStr: string = "HH:mm"): string {
  const kstDate = toKST(date);
  return format(kstDate, formatStr);
}

// 날짜+시간 포맷 (KST 기준)
export function formatDateTimeKST(date: Date | string, formatStr: string = "yyyy-MM-dd HH:mm"): string {
  const kstDate = toKST(date);
  return format(kstDate, formatStr);
}

// 날짜 + 시간 문자열을 UTC Date로 변환
export function createUTCDateTime(dateStr: string, timeStr: string): Date {
  // dateStr: "2024-01-15", timeStr: "14:00" (KST 기준)
  const kstDateTimeStr = `${dateStr}T${timeStr}:00`;
  return toUTC(kstDateTimeStr);
}

// 세션 종료 시간 계산
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  return addMinutes(startTime, durationMinutes);
}

// 요일 번호 가져오기 (0 = 일요일)
export function getDayOfWeekKST(date: Date | string): number {
  const kstDate = toKST(date);
  return getDay(kstDate);
}

// 하루의 시작 (KST 기준으로 계산 후 UTC로 반환)
export function startOfDayKST(date: Date | string): Date {
  const kstDate = toKST(date);
  const startKST = startOfDay(kstDate);
  return toUTC(startKST);
}

// 하루의 끝 (KST 기준으로 계산 후 UTC로 반환)
export function endOfDayKST(date: Date | string): Date {
  const kstDate = toKST(date);
  const endKST = endOfDay(kstDate);
  return toUTC(endKST);
}

// 24시간 이내인지 확인
export function isWithin24Hours(date: Date | string): boolean {
  const targetDate = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const hours24Later = addHours(now, 24);
  return isBefore(targetDate, hours24Later);
}

// 날짜 비교 (KST 기준)
export function isSameDayKST(date1: Date | string, date2: Date | string): boolean {
  return isSameDay(toKST(date1), toKST(date2));
}

// 특정 날짜가 과거인지 확인 (KST 기준)
export function isPastKST(date: Date | string): boolean {
  return isBefore(toKST(date), nowKST());
}

// 한국어 요일
export const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

// 요일 번호를 한국어로 변환
export function getWeekdayKo(dayOfWeek: number): string {
  return WEEKDAYS_KO[dayOfWeek];
}
