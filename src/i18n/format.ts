import type { TFunction } from 'i18next';

import { Locale } from './locale';

export function possessive(name: string, lng: string | undefined): string {
  if (lng === Locale.German) return /[sßxz]$/i.test(name) ? `${name}’` : `${name}s`;

  return /s$/i.test(name) ? `${name}’` : `${name}’s`;
}

export function listNames(t: TFunction, names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';

  return `${names.slice(0, -1).join(', ')} ${t('format.and')} ${names[names.length - 1]}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function ago(t: TFunction, ms: number): string {
  if (ms < MINUTE) return t('format.ago.justNow');
  if (ms < HOUR) return t('format.ago.minutes', { count: Math.floor(ms / MINUTE) });
  if (ms < DAY) return t('format.ago.hours', { count: Math.floor(ms / HOUR) });

  return t('format.ago.days', { count: Math.floor(ms / DAY) });
}

export function playedOn(t: TFunction, timestamp: number, now = Date.now()): string {
  const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);
  const days = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY);
  if (days <= 0) return t('format.playedOn.today');
  if (days === 1) return t('format.playedOn.yesterday');

  return t('format.playedOn.daysAgo', { count: days });
}
