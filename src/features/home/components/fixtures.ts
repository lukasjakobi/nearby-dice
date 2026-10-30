/** The start screen's props for this folder's stories (Storybook only). */
import { fn } from 'storybook/test';

import { PlayerColor, PRESET_ORDER } from '@/domain';
import { ago, listNames, playedOn } from '@/i18n';
import type { TFunction } from '@/i18n';
import { FIXED, IconName, PLAYER_COLOR_HEX } from '@/ui';

import { ResumeState } from '../hooks';
import type { Home, ModeChip, RecentRow, StatTile } from '../hooks';

const PLAYED_AT = Date.UTC(2026, 9, 24, 19, 30);

export const stats = (t: TFunction): StatTile[] => [
  {
    label: t('home.stats.wins'),
    value: 12,
    tint: PLAYER_COLOR_HEX[PlayerColor.Amber],
    icon: IconName.Cup,
    tilt: -1.5,
  },
  {
    label: t('home.stats.best'),
    value: 284,
    tint: PLAYER_COLOR_HEX[PlayerColor.Mint],
    icon: IconName.Star,
    tilt: 1,
    sub: t('labels.preset.classic.title'),
  },
  {
    label: t('home.stats.yatzys'),
    value: 7,
    tint: PLAYER_COLOR_HEX[PlayerColor.Sky],
    icon: IconName.Dice,
    tilt: -1,
  },
];

export const modeChips = (t: TFunction, selected = 0): ModeChip[] =>
  [null, ...PRESET_ORDER].map((id, i) => ({
    label: id === null ? t('home.statsAll') : t(`labels.preset.${id}.title`),
    selected: i === selected,
    onPress: fn(),
  }));

export const recentGames = (t: TFunction): RecentRow[] => [
  {
    id: 'one',
    place: 1,
    badge: PLAYER_COLOR_HEX[PlayerColor.Amber],
    opponents: listNames(t, ['Antonia', 'Jonas']),
    when: playedOn(t, PLAYED_AT),
    points: 251,
    onPress: fn(),
  },
  {
    id: 'two',
    place: 2,
    badge: FIXED.silver,
    opponents: listNames(t, ['Mia']),
    when: playedOn(t, PLAYED_AT - 86_400_000),
    points: 198,
    onPress: fn(),
  },
];

type HomeOptions = { newPlayer?: boolean; interrupted?: boolean; resume?: ResumeState };

/** The whole start screen; `newPlayer` has no profile yet, `interrupted` offers to resume. */
export function homeView(t: TFunction, options: HomeOptions = {}): Home {
  const profile = options.newPlayer
    ? null
    : { name: 'Lukas', avatar: { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] } };

  return {
    profile,
    greeting: profile ? t('home.greeting', { name: profile.name }) : t('home.welcome'),
    trainingHint: t('home.trainingHintBest', { best: 241 }),
    stats: stats(t),
    modeChips: modeChips(t),
    recent: options.newPlayer ? [] : recentGames(t),
    interrupted: options.interrupted
      ? {
          host: 'Antonia',
          round: 7,
          body: t('home.resume.body', {
            round: 7,
            total: 13,
            others: ['Antonia', 'Jonas'],
            host: 'Antonia',
            since: ago(t, 4 * 60_000),
          }),
        }
      : null,
    resume: {
      state: options.resume ?? ResumeState.Idle,
      attempt: 2,
      start: fn(),
      cancel: fn(),
      enterGame: fn(),
      discard: fn(),
    },
    discardOpen: false,
    askDiscard: fn(),
    cancelDiscard: fn(),
    confirmDiscard: fn(),
    openSettings: fn(),
    editProfile: fn(),
    createProfile: fn(),
    host: fn(),
    join: fn(),
    training: fn(),
  };
}
