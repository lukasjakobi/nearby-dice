import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { useInterruptedStore, useProfileStore, useStatsStore } from '@/store';
import { FIXED, IconName, PLAYER_COLOR_HEX } from '@/ui';
import { PlayerColor, PRESET_ORDER, PresetId, ranking, ZERO_MODE_STATS } from '@/domain';
import type { ModeStats, SavedGame } from '@/domain';
import { ago, listNames, playedOn } from '@/i18n';
import type { TFunction } from '@/i18n';
import { avatarOf, navigate, ProfileMode, Route, useNow } from '@/shared';

import { useResume } from './useResume';

export type StatTile = {
  label: string;
  value: number;
  tint: string;
  icon: IconName;
  tilt: number;
  sub?: string;
};
export type ModeChip = { label: string; selected: boolean; onPress: () => void };
export type RecentRow = {
  id: string;
  place: number;
  badge: string;
  opponents: string;
  when: string;
  points: number;
  onPress: () => void;
};

/** The selected mode's own stats, or the combined total across every mode. */
function statsForMode(
  t: TFunction,
  modes: Partial<Record<PresetId, ModeStats>>,
  selected: PresetId | null,
): ModeStats & { sub?: string } {
  if (selected !== null) return modes[selected] ?? ZERO_MODE_STATS;
  const all = PRESET_ORDER.map((id) => ({ id, ...(modes[id] ?? ZERO_MODE_STATS) }));
  const wins = all.reduce((sum, m) => sum + m.wins, 0);
  const yatzys = all.reduce((sum, m) => sum + m.yatzys, 0);
  const top = all.reduce((a, m) => (m.best > a.best ? m : a), all[0]!);

  return { wins, yatzys, best: top.best, sub: t(`labels.preset.${top.id}.title`) };
}

/** My place and points in a saved game, against everyone who stayed to the end. */
function recentRow(t: TFunction, saved: SavedGame): RecentRow {
  const placements = ranking(saved.game);
  const mine = placements.find((placement) => placement.playerId === saved.myId)!;
  const opponents = placements
    .filter((placement) => placement.playerId !== saved.myId)
    .map((placement) => saved.players.find((player) => player.id === placement.playerId)!.name);

  return {
    id: saved.id,
    place: mine.place,
    badge: mine.place === 1 ? PLAYER_COLOR_HEX[PlayerColor.Amber] : FIXED.silver,
    opponents: listNames(t, opponents),
    when: playedOn(t, saved.playedAt),
    points: mine.total,
    onPress: () => navigate.push(Route.SavedGame, { id: saved.id }),
  };
}

/** Everything the start screen shows and does; `HomeContent` renders it. */
export type Home = ReturnType<typeof useHome>;

export function useHome() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const stats = useStatsStore();
  const interrupted = useInterruptedStore((s) => s.interrupted);
  const resume = useResume(interrupted);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PresetId | null>(null);
  const now = useNow(60_000);

  const stat = (
    label: string,
    value: number,
    color: PlayerColor,
    icon: IconName,
    tilt: number,
    sub?: string,
  ): StatTile => ({
    label,
    value,
    tint: PLAYER_COLOR_HEX[color],
    icon,
    tilt,
    sub,
  });

  const current = statsForMode(t, stats.modes, selectedMode);

  return {
    profile: profile ? { name: profile.name, avatar: avatarOf(profile) } : null,
    greeting: profile ? t('home.greeting', { name: profile.name }) : t('home.welcome'),
    trainingHint:
      stats.trainingBest > 0
        ? t('home.trainingHintBest', { best: stats.trainingBest })
        : t('home.trainingHint'),
    stats: [
      stat(t('home.stats.wins'), current.wins, PlayerColor.Amber, IconName.Cup, -1.5),
      stat(t('home.stats.best'), current.best, PlayerColor.Mint, IconName.Star, 1, current.sub),
      stat(t('home.stats.yatzys'), current.yatzys, PlayerColor.Sky, IconName.Dice, -1),
    ],
    modeChips: [null, ...PRESET_ORDER].map((id): ModeChip => ({
      label: id === null ? t('home.statsAll') : t(`labels.preset.${id}.title`),
      selected: id === selectedMode,
      onPress: () => setSelectedMode(id),
    })),
    recent: stats.recent.map((saved) => recentRow(t, saved)),
    interrupted: interrupted
      ? {
          host: interrupted.hostName,
          round: interrupted.round,
          body: t('home.resume.body', {
            round: interrupted.round,
            total: interrupted.totalRounds,
            others:
              interrupted.otherPlayers.length > 0
                ? interrupted.otherPlayers
                : [interrupted.hostName],
            host: interrupted.hostName,
            since: ago(t, now - interrupted.lastSeenAt),
          }),
        }
      : null,
    resume,
    discardOpen,
    askDiscard: () => setDiscardOpen(true),
    cancelDiscard: () => setDiscardOpen(false),
    confirmDiscard: () => {
      setDiscardOpen(false);
      resume.discard();
    },
    openSettings: () => navigate.push(Route.Settings),
    editProfile: () => navigate.push(Route.Profile, { mode: ProfileMode.Edit }),
    createProfile: () => navigate.push(Route.Profile, { mode: ProfileMode.Create }),
    host: () => navigate.push(Route.HostSetup),
    join: () => navigate.push(Route.Join),
    training: () => navigate.push(Route.Training),
  };
}
