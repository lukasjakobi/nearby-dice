import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';

import {
  gamePlayer,
  yatzyCount,
  PRESET_ORDER,
  TRAINING_PRESET_ORDER,
  turnsPerPlayer,
} from '@/domain';
import type { PresetId } from '@/domain';
import { RematchVote, Role, SessionPhase } from '@/session';
import { useStatsStore } from '@/store';
import { useSession } from '@/features/session';
import { avatarOf, useBackAction } from '@/shared';
import type { AvatarView } from '@/shared';

import { buildResults, winnerHeadline } from '../view';
import { gameIdOf, useRecordResult } from './useRecordResult';
import { useShownGame } from './useShownGame';

export type VoteChip = { id: string; name: string; avatar: AvatarView; vote: RematchVote };
/** Training shows a few numbers instead of a one-row ranking. */
export type FactRow = { label: string; value: number };

/** What the footer offers right now. */
export enum RematchAction {
  /** Not voted yet (host and guests alike): "Revanche". */
  Vote = 'vote',
  /** Voted: waiting for the others, or the rematch is starting. */
  Waiting = 'waiting',
  /** Training: "Nochmal spielen". */
  Restart = 'restart',
}

export function useResults() {
  const { t } = useTranslation();
  const { session, snapshot } = useSession();
  const trainingBest = useStatsStore((s) => s.trainingBest);
  const trainingBestId = useStatsStore((s) => s.trainingBestId);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const { shared, myId } = snapshot;
  const shown = useShownGame(snapshot);
  const { game } = shown;
  const isHost = session.role === Role.Host;
  const training = session.role === Role.Training;
  const newBest = training && trainingBestId === gameIdOf(snapshot);

  const { rows, standings, awards, compare } = useMemo(
    () => buildResults(t, game, shown.players, shown.myId),
    [game, shown.myId, shown.players, t],
  );
  useRecordResult(snapshot, rows);
  const winners = rows.filter((r) => r.winner);
  const headline = training
    ? newBest
      ? t('results.training.newBest')
      : t('results.training.done')
    : winnerHeadline(t, rows);
  const facts: FactRow[] | null = training
    ? [
        { label: t('results.training.best'), value: trainingBest },
        {
          label: t('results.training.yatzys'),
          value: yatzyCount(gamePlayer(game, shown.myId)?.sheets ?? []),
        },
      ]
    : null;

  // Nothing is lost by leaving a finished Training, so it needs no confirmation.
  const askLeave = () => (training ? session.leave() : setLeaveOpen(true));
  useBackAction(askLeave);

  // Everyone votes alike, the host included; the rematch starts once all have decided.
  const votes: VoteChip[] = shared.players
    .filter((p) => shared.rematch[p.id] !== undefined)
    .map((p) => ({ id: p.id, name: p.name, avatar: avatarOf(p), vote: shared.rematch[p.id]! }));
  const rematchStarting = shared.phase === SessionPhase.Countdown;
  const action = training
    ? RematchAction.Restart
    : shared.rematch[myId] === RematchVote.Pending && !rematchStarting
      ? RematchAction.Vote
      : RematchAction.Waiting;
  const waitingText = rematchStarting
    ? t('results.rematchStarting')
    : t('results.waitingForOthers');

  const dialogKey = isHost ? 'endHostDialog' : 'endGuestDialog';
  const dialog = {
    title: t(`results.${dialogKey}.title`),
    body: t(`results.${dialogKey}.body`),
    confirm: t(`results.${dialogKey}.confirm`),
  };
  // The host (or the Training player) picks the next game's mode until the rematch starts.
  const canChangePreset = session.role !== Role.Guest && shared.phase === SessionPhase.Finished;

  return {
    headline,
    winners,
    /** Training has no ranking, so its points go under the headline. */
    summary: training
      ? t('results.summary', {
          points: t('format.points', { count: winners[0]?.points ?? 0 }),
          count: turnsPerPlayer(game.rules),
        })
      : undefined,
    /** The crown marks a win, or a new best in Training. */
    crown: !training || newBest,
    rows,
    standings,
    awards,
    compare,
    facts,
    preset: shared.preset,
    presets: training ? TRAINING_PRESET_ORDER : PRESET_ORDER,
    presetOpen: presetOpen && canChangePreset,
    openPreset: canChangePreset ? () => setPresetOpen(true) : undefined,
    closePreset: () => setPresetOpen(false),
    choosePreset: (id: PresetId) => {
      setPresetOpen(false);
      if (session.role !== Role.Guest) session.setPreset(id);
    },
    votes,
    action,
    waitingText,
    leaveLabel: training
      ? t('results.training.home')
      : isHost
        ? t('results.endHost')
        : t('results.endGuest'),
    dialog,
    leaveOpen,
    vote: () => session.voteRematch(RematchVote.Yes),
    restart: () => {
      if (session.role === Role.Training) session.restart();
    },
    askLeave,
    cancelLeave: () => setLeaveOpen(false),
    confirmLeave: () => {
      setLeaveOpen(false);
      session.leave();
    },
  };
}
