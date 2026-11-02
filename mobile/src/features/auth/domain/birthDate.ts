import { z } from 'zod';

const MIN_AGE = 5;
const MAX_AGE = 110;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** Parses `YYYY-MM-DD` as a calendar date (no time zone involved). */
function parseIsoDate(value: string): DateParts | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  const exists =
    probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  return exists ? { year, month, day } : null;
}

function localParts(date: Date): DateParts {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

function compare(a: DateParts, b: DateParts): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Full years between `birthDate` (ISO) and `today` (local calendar day). */
export function ageOn(birthDate: string, today: Date): number {
  const birth = parseIsoDate(birthDate);
  if (!birth) return Number.NaN;
  const now = localParts(today);
  const hadBirthday = now.month > birth.month || (now.month === birth.month && now.day >= birth.day);
  return now.year - birth.year - (hadBirthday ? 0 : 1);
}

/**
 * Birth date: ISO format, a real past day and an age between 5 and 110.
 * `today` is injectable so the rules are testable.
 *
 * TODO(product): minors are allowed for now. LOPDP requires parental consent
 * for minors; how to collect it is an open decision (CONTEXTO.md, section 10).
 */
export function makeBirthDateSchema(today: () => Date = () => new Date()) {
  return z
    .string()
    .trim()
    .regex(ISO_DATE, 'Usa el formato AAAA-MM-DD.')
    .refine((value) => parseIsoDate(value) !== null, 'La fecha no existe.')
    .refine((value) => {
      const birth = parseIsoDate(value);
      return birth !== null && compare(birth, localParts(today())) < 0;
    }, 'La fecha de nacimiento debe ser anterior a hoy.')
    .refine((value) => {
      const age = ageOn(value, today());
      return age >= MIN_AGE && age <= MAX_AGE;
    }, `La edad debe estar entre ${MIN_AGE} y ${MAX_AGE} años.`);
}
