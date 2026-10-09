/** Offset (minutes east of UTC) of an IANA zone at a given UTC instant. */
function zoneOffsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - utcMs) / 60000);
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, '0');
}

/** Interpret wall-clock fields in an IANA zone; returns ISO-8601 with explicit offset, or null if invalid. */
export function wallTimeToIso(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  timeZone: string,
): string | null {
  const probe = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mo - 1 ||
    probe.getUTCDate() !== d ||
    h > 23 ||
    mi > 59 ||
    s > 59
  ) {
    return null;
  }
  const guess = probe.getTime();
  let off = zoneOffsetMinutes(guess, timeZone);
  const refined = zoneOffsetMinutes(guess - off * 60000, timeZone);
  off = refined;
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${pad(y, 4)}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Compact "YYYY-MM-DD HH:MM" used in model input (wall time as stored). */
export function isoToWall(iso: string | null): string {
  if (!iso) return 'no time';
  return iso.slice(0, 16).replace('T', ' ');
}
