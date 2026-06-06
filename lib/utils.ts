import { useState, useEffect } from 'react';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a human-readable relative timestamp.
 * Recent events: "2 hours ago", "just now". Older: "May 12, 2026".
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60)  return 'just now';
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  }
  if (seconds < 604800) {
    const d = Math.floor(seconds / 86400);
    return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  }
  // Older than a week so show the full date
  return date.toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * React hook that returns a live-updating relative time string.
 * Re-evaluates every 30 seconds so "3 minutes ago" becomes "4 minutes ago".
 */
export function useTimeAgo(dateString: string): string {
  const [relative, setRelative] = useState(() => timeAgo(dateString));
  useEffect(() => {
    const interval = setInterval(() => setRelative(timeAgo(dateString)), 30000);
    return () => clearInterval(interval);
  }, [dateString]);
  return relative;
}
