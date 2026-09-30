/**
 * Persian typography, Jalali date conversion and utility functions
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English digits (0-9) to Persian digits (۰-۹)
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

/**
 * Formats bytes into a human readable Persian string (e.g. ۳.۲ مگابایت)
 */
export function formatBytesPersian(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '۰ بایت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${toPersianDigits(val)} ${sizes[i]}`;
}

/**
 * Formats a Gregorian date string (YYYY-MM-DD or ISO) into standard Persian Jalali display
 */
export function formatPersianDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    // Using standard Intl.DateTimeFormat with Persian calendar
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Short Persian date representation (e.g. ۱۴۰۳/۰۷/۱۵)
 */
export function formatPersianDateShort(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Relative Persian time display (e.g. «امروز»، «دیروز»، «۳ روز پیش»)
 */
export function formatPersianRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    if (diffDays < 7) return `${toPersianDigits(diffDays)} روز پیش`;
    if (diffDays < 30) return `${toPersianDigits(Math.floor(diffDays / 7))} هفته پیش`;
    if (diffDays < 365) return `${toPersianDigits(Math.floor(diffDays / 30))} ماه پیش`;
    return `${toPersianDigits(Math.floor(diffDays / 365))} سال پیش`;
  } catch {
    return '';
  }
}

/**
 * Calculate countdown in days/hours for exams
 */
export function getExamCountdown(dateStr: string, timeStr: string = '08:00'): {
  isPast: boolean;
  days: number;
  hours: number;
  text: string;
} {
  try {
    const target = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { isPast: true, days: 0, hours: 0, text: 'برگزار شده' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours === 0) {
      return { isPast: false, days: 0, hours: 0, text: 'کمتر از ۱ ساعت' };
    }
    if (days === 0) {
      return { isPast: false, days: 0, hours, text: `${toPersianDigits(hours)} ساعت مانده` };
    }
    return {
      isPast: false,
      days,
      hours,
      text: `${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت مانده`,
    };
  } catch {
    return { isPast: false, days: 0, hours: 0, text: 'نامشخص' };
  }
}
