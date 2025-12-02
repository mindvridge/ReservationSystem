// 유효성 검사 규칙 타입
type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

// 유효성 검사 실행
export function validate<T extends Record<string, unknown>>(
  data: T,
  rules: ValidationRules<T>
): { isValid: boolean; errors: ValidationErrors<T> } {
  const errors: ValidationErrors<T> = {};

  for (const key in rules) {
    const fieldRules = rules[key];
    const value = data[key];

    if (fieldRules) {
      for (const rule of fieldRules) {
        if (!rule.validate(value as T[typeof key])) {
          errors[key] = rule.message;
          break;
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 공통 유효성 검사 규칙들
export const rules = {
  required: (message = "필수 입력 항목입니다."): ValidationRule<unknown> => ({
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message,
  }),

  email: (message = "올바른 이메일 형식이 아닙니다."): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  phone: (message = "올바른 휴대폰 번호 형식이 아닙니다."): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      const phoneRegex = /^01[0-9]{8,9}$/;
      return phoneRegex.test(value.replace(/-/g, ""));
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length >= min,
    message: message || `최소 ${min}자 이상 입력해주세요.`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length <= max,
    message: message || `최대 ${max}자까지 입력 가능합니다.`,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value === undefined || value >= min,
    message: message || `${min} 이상이어야 합니다.`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value === undefined || value <= max,
    message: message || `${max} 이하여야 합니다.`,
  }),

  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value === undefined || (value >= min && value <= max),
    message: message || `${min}에서 ${max} 사이여야 합니다.`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => !value || regex.test(value),
    message,
  }),

  minItems: (min: number, message?: string): ValidationRule<unknown[]> => ({
    validate: (value) => !value || value.length >= min,
    message: message || `최소 ${min}개 이상 선택해주세요.`,
  }),

  maxItems: (max: number, message?: string): ValidationRule<unknown[]> => ({
    validate: (value) => !value || value.length <= max,
    message: message || `최대 ${max}개까지 선택 가능합니다.`,
  }),
};

// 실시간 검증을 위한 개별 필드 검증
export function validateField<T>(
  value: T,
  fieldRules: ValidationRule<T>[]
): string | undefined {
  for (const rule of fieldRules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return undefined;
}

// 예약 폼 검증
export function validateBookingForm(data: {
  counselorId?: string;
  date?: Date;
  timeSlot?: string;
  notes?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.counselorId) {
    errors.counselorId = "상담사를 선택해주세요.";
  }

  if (!data.date) {
    errors.date = "날짜를 선택해주세요.";
  }

  if (!data.timeSlot) {
    errors.timeSlot = "시간을 선택해주세요.";
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = "메모는 500자 이내로 작성해주세요.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 상담사 프로필 검증
export function validateCounselorProfile(data: {
  name?: string;
  bio?: string;
  specialties?: string[];
  sessionDuration?: number;
  sessionPrice?: number;
  phone?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = "이름을 입력해주세요.";
  }

  if (!data.bio?.trim()) {
    errors.bio = "자기소개를 입력해주세요.";
  } else if (data.bio.length < 20) {
    errors.bio = "자기소개는 최소 20자 이상 입력해주세요.";
  } else if (data.bio.length > 1000) {
    errors.bio = "자기소개는 최대 1000자까지 입력 가능합니다.";
  }

  if (!data.specialties || data.specialties.length === 0) {
    errors.specialties = "최소 1개 이상의 전문분야를 선택해주세요.";
  }

  if (data.sessionDuration !== undefined) {
    if (data.sessionDuration < 30 || data.sessionDuration > 120) {
      errors.sessionDuration = "상담 시간은 30분에서 120분 사이여야 합니다.";
    }
  }

  if (data.sessionPrice !== undefined) {
    if (data.sessionPrice < 10000 || data.sessionPrice > 500000) {
      errors.sessionPrice = "상담 비용은 10,000원에서 500,000원 사이여야 합니다.";
    }
  }

  if (data.phone) {
    const phoneRegex = /^01[0-9]{8,9}$/;
    if (!phoneRegex.test(data.phone.replace(/-/g, ""))) {
      errors.phone = "올바른 휴대폰 번호 형식이 아닙니다.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 스케줄 검증
export function validateSchedule(data: {
  startTime?: string;
  endTime?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.startTime) {
    errors.startTime = "시작 시간을 입력해주세요.";
  }

  if (!data.endTime) {
    errors.endTime = "종료 시간을 입력해주세요.";
  }

  if (data.startTime && data.endTime) {
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      errors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
