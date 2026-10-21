/**
 * Small formatting helpers shared by pages.
 *
 * Deliberately tiny and locale-fixed (`en`): documents and app chrome must
 * render identically on server and client, and `toLocaleDateString` without a
 * locale picks up the server's timezone/language, which silently differs from
 * the browser's.
 */

export function formatDate(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return value.toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** 'YYYY-MM' (month precision) → “Apr 2025”. */
export function formatMonth(iso: string): string {
  const [year, month] = iso.split('-');
  if (!year || !month) return iso;
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
