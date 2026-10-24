import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';

import type { TFunction } from '@/i18n';
import { Role, setActiveSession } from '@/session';
import { useSession } from '@/features/session';
import { navigate, Route, useBackAction, useFeedback, useFeedbackSwitches } from '@/shared';

import { ControlKind, buildGameView, buildScoreboard } from '../view';
import type { CellView } from '../view';
import { useDiceAnimation } from './useDiceAnimation';
import { useGameFeedback } from './useGameFeedback';
import { usePendingScore } from './usePendingScore';
import { useSheetPage } from './useSheetPage';
import { useYatzyFlag } from './useYatzyFlag';

export enum GameSheet {
  None = 'none',
  Scoreboard = 'scoreboard',
  Menu = 'menu',
  LostPlayer = 'lost-player',
}

export enum GameDialog {
  None = 'none',
  Leave = 'leave',
  Remove = 'remove',
}

/** What "leave" means for each role, in the menu and its dialog. */
function leaveText(t: TFunction, role: Role): { label: string; body: string } {
  const text: Record<Role, ReturnType<typeof leaveText>> = {
    [Role.Host]: { label: t('game.leaveHost'), body: t('game.leaveHostBody') },
    [Role.Guest]: { label: t('game.leaveGuest'), body: t('game.leaveGuestBody') },
    [Role.Training]: { label: t('game.leaveTraining'), body: t('game.leaveTrainingBody') },
  };

  return text[role];
}

/** The full card stays a beat after the last entry, then the results take over. */
const RESULTS_DELAY_MS = 1100;

export function useGameScreen() {
  const { t } = useTranslation();
  const { session, snapshot } = useSession();
  const feedback = useFeedback();
  const feedbackSwitches = useFeedbackSwitches();
  const game = snapshot.shared.game;
  const dice = useDiceAnimation(game?.turn);
  const page = useSheetPage(game, snapshot.shared.gameNumber);
  const { sheetIndex } = page;
  const [openSheet, setOpenSheet] = useState(GameSheet.None);
  const [dialog, setDialog] = useState(GameDialog.None);
  const rollPending = dice.rollPending;
  const score = usePendingScore(snapshot, sheetIndex, rollPending);
  const { pending, selectedCategory, scorePending } = score;
  useGameFeedback(snapshot);
  const yatzyFlag = useYatzyFlag(snapshot, dice.shownSeq, dice.shownDice);

  const view = buildGameView(t, snapshot, {
    sheetIndex,
    viewed: page.viewed,
    shownDice: dice.shownDice,
    shownRolled: dice.shownRolled,
    rolling: dice.rolling,
    rollPending,
    scorePending,
    selectedCategory,
  });
  const scoreboard = useMemo(
    () => (openSheet === GameSheet.Scoreboard ? buildScoreboard(t, snapshot) : null),
    [openSheet, snapshot, t],
  );

  const finished = !!view?.finished;
  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => navigate.replace(Route.Results), RESULTS_DELAY_MS);

    return () => clearTimeout(timer);
  }, [finished]);

  const selectedCell = view?.selectedCell;
  const confirm = selectedCell
    ? {
        category: selectedCell.category,
        label: selectedCell.label,
        points: t('format.points', { count: Number(selectedCell.value) }),
        strike: Number(selectedCell.value) === 0,
        sending: scorePending,
      }
    : null;
  // Every phone shows the selection; a roll clears it there on its own.
  const clearSelection = () => {
    score.clear();
    if (confirm) session.focus(null);
  };

  useBackAction(() => {
    if (confirm && !scorePending) {
      clearSelection();

      return;
    }

    if (!view?.countdownEndsAt) setOpenSheet(GameSheet.Menu);
  });

  const close = () => setOpenSheet(GameSheet.None);

  return {
    view,
    shakeKeys: dice.shakeKeys,
    yatzyFlag: yatzyFlag.flag,
    closeYatzyFlag: yatzyFlag.close,
    scoreboard,
    openSheet,
    dialog,
    confirm,

    roll: () => {
      if (view?.control.kind !== ControlKind.MyTurn || !view.control.canRoll) return;
      score.clear();
      feedback.roll();
      dice.request();
      session.roll();
    },
    toggleHold: (die: number) => {
      // With a field selected the dice are locked in for scoring.
      if (confirm || !view?.dice[die]?.canToggle) return;
      feedback.hold(!view.dice[die]!.held);
      session.toggleHold(die);
    },
    selectSheet: (index: number) => {
      // A sheet opened from the pills turns its pages on this phone alone.
      if (view?.viewingOther && page.viewed) {
        page.setViewed({ ...page.viewed, sheetIndex: index });

        return;
      }

      // Only the player whose turn it is turns the pages; everyone else follows them.
      if (game?.turn.playerId !== snapshot.myId) return;
      clearSelection();
      page.setSheetIndex(index);
      if (index !== sheetIndex) session.viewSheet(index);
    },
    pick: (cell: CellView) => {
      if (!cell.pickable || !game || !view || rollPending || scorePending) return;
      feedback.tap();
      if (confirm?.category === cell.category) {
        clearSelection();

        return;
      }

      score.select(cell.category, view.sheet.selectedTab);
      session.focus({ category: cell.category, sheet: view.sheet.selectedTab });
    },
    confirmScore: () => {
      if (confirm && pending && !pending.sent) {
        score.markSent();
        session.score(pending.category, pending.sheet);
      }
    },
    viewPlayer: (playerId: string) => {
      // Their sheet opens on this phone only. Tapping the player whose turn it is, or the
      // pill already open, follows the turn again.
      const follow = playerId === game?.turn.playerId || playerId === page.viewed?.playerId;
      page.setViewed(follow ? null : { playerId, sheetIndex: 0 });
    },
    showTurnSheet: () => page.setViewed(null),
    closeSheet: close,
    openScoreboard: () => setOpenSheet(GameSheet.Scoreboard),
    openMenu: () => setOpenSheet(GameSheet.Menu),
    openLostPlayer: () => setOpenSheet(GameSheet.LostPlayer),
    feedbackSwitches,

    leaveLabel: leaveText(t, session.role).label,
    leaveBody: leaveText(t, session.role).body,
    askLeave: () => {
      close();
      setDialog(GameDialog.Leave);
    },
    confirmLeave: () => {
      setDialog(GameDialog.None);
      session.leave();
    },

    skipLostTurn: () => {
      if (session.role === Role.Host && view?.lostPlayer?.canSkip)
        session.skipTurn(view.lostPlayer.id);
      close();
    },
    askRemove: () => {
      close();
      setDialog(GameDialog.Remove);
    },
    confirmRemove: () => {
      if (session.role === Role.Host && view?.lostPlayer)
        session.removeFromGame(view.lostPlayer.id);
      setDialog(GameDialog.None);
    },
    dismissDialog: () => setDialog(GameDialog.None),

    reconnect: () => {
      if (session.role === Role.Guest) session.reconnect();
    },
    goHome: () => setActiveSession(null),
  };
}
