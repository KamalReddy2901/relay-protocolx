import { wallTimeToIso } from './time';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function wallParts(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
}

function addDays(y: number, mo: number, d: number, n: number) {
  const t = new Date(Date.UTC(y, mo - 1, d + n));
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}

/**
 * Deterministic deadline resolution anchored to a message timestamp (ISO with the selected timezone).
 * Returns null when the text cannot be resolved; callers then show the text as written.
 */
export function resolveDeadline(text: string | null, anchorIso: string | null, timeZone: string): string | null {
  if (!text || !anchorIso) return null;
  const a = wallParts(anchorIso);
  if (!a) return null;
  const t = text.toLowerCase();

  let time: { h: number; mi: number } | null = null;
  const tm = t.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/) ?? t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (tm) {
    let h = +tm[1];
    const mi = tm[2] ? +tm[2] : 0;
    if (tm[3]) h = (h % 12) + (tm[3] === 'pm' ? 12 : 0);
    if (h <= 23) time = { h, mi };
  } else if (/\bnoon\b/.test(t)) time = { h: 12, mi: 0 };
  else if (/\bmidnight\b/.test(t)) time = { h: 23, mi: 59 };
  else if (/\b(eod|end of (the )?day|tonight)\b/.test(t)) time = { h: 23, mi: 59 };

  let day: { y: number; mo: number; d: number } | null = null;
  if (/\btomorrow\b/.test(t)) day = addDays(a.y, a.mo, a.d, 1);
  else if (/\b(today|tonight|eod|end of (the )?day)\b/.test(t)) day = { y: a.y, mo: a.mo, d: a.d };
  else {
    const wd = WEEKDAYS.findIndex((w) => new RegExp(`\\b${w}\\b`).test(t));
    if (wd >= 0) {
      const cur = addDays(a.y, a.mo, a.d, 0).wd;
      let diff = (wd - cur + 7) % 7;
      if (diff === 0 && !/\btoday\b/.test(t)) diff = 0;
      day = addDays(a.y, a.mo, a.d, diff);
    } else {
      const md = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
      const dm = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
      if (md) day = { y: a.y, mo: MONTHS.indexOf(md[2]) + 1, d: +md[1] };
      else if (dm) day = { y: a.y, mo: MONTHS.indexOf(dm[1]) + 1, d: +dm[2] };
    }
  }
  if (!day && !time) return null;
  // Time only: same day as the anchor.
  const d = day ?? { y: a.y, mo: a.mo, d: a.d };
  const tt = time ?? { h: 23, mi: 59 };
  return wallTimeToIso(d.y, d.mo, d.d, tt.h, tt.mi, 0, timeZone);
}

const MON_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "4pm 10 Oct" from the wall-clock part of an ISO string (already in the selected zone). */
export function formatDue(iso: string): string {
  const p = wallParts(iso);
  if (!p) return iso;
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const clock = `${h12}${p.mi ? ':' + String(p.mi).padStart(2, '0') : ''}${p.h < 12 ? 'am' : 'pm'}`;
  return `${clock} ${p.d} ${MON_LABEL[p.mo - 1]}`;
}

export function formatWall(iso: string | null): string {
  if (!iso) return 'no time';
  const p = wallParts(iso);
  if (!p) return iso;
  return `${p.d} ${MON_LABEL[p.mo - 1]} ${p.y} ${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`;
}

export function sameWallDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

const CUE = /\b(by|before|until|till|due|deadline|no later than|eod|end of (the )?day|tonight)\b/i;

/**
 * A model-supplied time is a task deadline only when the sentence that contains it carries a deadline cue
 * ("by Friday 5pm"). Otherwise it is the event's time (e.g. "setup at 4pm"), which is shown as context.
 */
export function isTaskDeadline(deadlineText: string, messageTexts: string[]): boolean {
  const needle = deadlineText.trim().toLowerCase();
  if (!needle) return false;
  for (const text of messageTexts) {
    for (const sentence of text.split(/(?<=[.!?])\s+|\n/)) {
      if (sentence.toLowerCase().includes(needle) && CUE.test(sentence)) return true;
    }
  }
  return false;
}
