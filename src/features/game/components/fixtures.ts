/**
 * Game states for this folder's stories (Storybook only). Bots play a real game and the real
 * view builders turn it into props, so a story shows exactly what the game screen would.
 */
import { Category, PlayerColor, PRESETS, PresetId } from '@/domain';
import type { TFunction } from '@/i18n';
import type { PlayerInfo } from '@/session';
import { ANTONIA, JONAS, LUKAS, playedGame, snapshot, withDice } from '@/test/fixtures';

import { CellState, buildGameView, buildScoreboard, buildYatzyFlag } from '../view';
import type { GameView, LocalState, ScoreboardView, YatzyFlagView } from '../view';

export const PLAYERS = [LUKAS, ANTONIA, JONAS];

/** Six players, so the scoreboard has to scroll sideways. */
export const SIX_PLAYERS: PlayerInfo[] = [
  ...PLAYERS,
  { ...ANTONIA, id: 'mia', name: 'Mia', color: PlayerColor.Mint },
  { ...ANTONIA, id: 'samir', name: 'Samir', color: PlayerColor.Lilac },
  { ...ANTONIA, id: 'katja', name: 'Katja', color: PlayerColor.Yellow },
];

/** A roll that previews well: three fives fill several fields, some with 0. */
export const THREE_FIVES = [5, 5, 5, 2, 3];

/** Which open field a scene selects, whatever the bots have filled so far. */
export enum FieldPick {
  /** The field the dice score most in. */
  Best = 'best',
  /** A field the dice score 0 in ("Streichen"). */
  Zero = 'zero',
}

export type Scene = {
  players?: PlayerInfo[];
  /** Fields the bots have entered before the scene. */
  turns?: number;
  preset?: PresetId;
  /** The dice on the table; without them the player whose turn it is has not rolled yet. */
  dice?: number[];
  /** Whose phone this is; by default the player whose turn it is. */
  me?: PlayerInfo;
  /** The field the player whose turn it is has selected. */
  selected?: Category | FieldPick;
  local?: Partial<LocalState>;
};

export type SceneView = { view: GameView; board: ScoreboardView };

/** The game screen's props for one moment of a game. */
export function gameScene(t: TFunction, scene: Scene = {}): SceneView {
  if (scene.selected === FieldPick.Best || scene.selected === FieldPick.Zero) {
    const pick = scene.selected;
    const { sheet } = gameScene(t, { ...scene, selected: undefined }).view;
    const cells = [...sheet.upper, ...sheet.lower].filter(
      (cell) =>
        cell.state === (pick === FieldPick.Zero ? CellState.PreviewZero : CellState.Preview),
    );
    const best = cells.reduce((a, b) => (Number(b.value) > Number(a.value) ? b : a));

    return gameScene(t, { ...scene, selected: best.category });
  }

  const players = scene.players ?? PLAYERS;
  const preset = scene.preset ?? PresetId.Classic;
  let game = playedGame(players, scene.turns ?? 9, PRESETS[preset]);
  if (scene.dice) game = withDice(game, scene.dice);
  const me = scene.me ?? players.find((player) => player.id === game.turn.playerId)!;
  const snap = snapshot({ players, myId: me.id, game, shared: { preset } });
  const local: LocalState = {
    sheetIndex: 0,
    viewed: null,
    shownDice: game.turn.dice,
    shownRolled: game.turn.rollsUsed > 0,
    rolling: false,
    rollPending: false,
    scorePending: false,
    selectedCategory: (scene.selected as Category | undefined) ?? null,
    ...scene.local,
  };

  return { view: buildGameView(t, snap, local)!, board: buildScoreboard(t, snap)! };
}

/** The flag for a Yatzy by `player`. */
export const yatzyFlag = (player: PlayerInfo = LUKAS): YatzyFlagView => buildYatzyFlag(player, 1);
