/**
 * Format a timestamp as a short relative time string (e.g. "2m", "3h", "1d").
 * Returns null for invalid/missing timestamps.
 */
export function relativeTime(ts: number | undefined): string | null {
  if (!ts) return null;
  const now = Date.now();
  const diff = Math.max(0, now - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '<1m';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}
