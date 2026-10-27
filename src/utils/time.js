// Day boundaries are computed in the site's own timezone so "Today" matches the mall's day,
// not the viewer's.

const DAY = 24 * 60 * 60 * 1000;

function tzOffsetMs(utcMs, timeZone) {
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
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// "YYYY-MM-DD" for the given instant in the given timezone.
export function dateKeyInZone(utcMs, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(utcMs));
}

// UTC millis of local midnight for a "YYYY-MM-DD" date in the given timezone.
export function startOfDayInZone(dateKey, timeZone) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const offset = tzOffsetMs(guess, timeZone);
  let start = guess - offset;
  // Correct for DST transitions between the guess and the real midnight.
  const offset2 = tzOffsetMs(start, timeZone);
  if (offset2 !== offset) start = guess - offset2;
  return start;
}

export function shiftDateKey(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY).toISOString().slice(0, 10);
}

// Range for the selected day; for today the range ends "now". The comparison range is the
// same window one day earlier, so "vs yesterday" compares like with like.
export function dayRanges(dateKey, timeZone, now = Date.now()) {
  const from = startOfDayInZone(dateKey, timeZone);
  const to = Math.min(from + DAY - 1, now);
  const prevFrom = startOfDayInZone(shiftDateKey(dateKey, -1), timeZone);
  return {
    current: { fromUtc: from, toUtc: to },
    previous: { fromUtc: prevFrom, toUtc: prevFrom + (to - from) },
    isToday: dateKey === dateKeyInZone(now, timeZone),
  };
}

export function formatTime(utcMs, timeZone) {
  if (utcMs === null || utcMs === undefined) return '—';
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(utcMs));
}

export function formatHour(utcMs, timeZone) {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(utcMs));
}

export function formatDateTime(utcMs, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(utcMs));
}

// 8.5 -> "08min 30sec", 75 -> "1h 15min"
export function formatDwell(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—';
  const totalSec = Math.round(minutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}sec`;
}

// 20 -> "00:20", 75 -> "01:15"
export function formatDwellShort(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—';
  const total = Math.round(minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function percentChange(current, previous) {
  if (current === null || previous === null || previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
