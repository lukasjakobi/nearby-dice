import * as Crypto from 'expo-crypto';

import { ActionType, HistoryKind } from '@/domain/engine';
import { PlayerColor } from '@/domain/player';
import { seededRng } from '@/domain/random';
import { PRESETS, PresetId } from '@/domain/rules';
import { botMove } from '@/dev';

import { TrainingSession } from '../TrainingSession';
import { TIMING } from '../timing';
import { EndReason, Role, SessionPhase } from '../types';

jest.useFakeTimers();

const PROFILE = { name: 'Lukas', color: PlayerColor.Amber };

function training(preset = PresetId.Classic) {
  return new TrainingSession({ profile: PROFILE, preset, rng: seededRng(7) });
}

test('creates its session ID from the secure random source', () => {
  const random = jest.spyOn(Crypto, 'getRandomValues').mockImplementation((array) => {
    array.fill(1);

    return array;
  });
  try {
    const session = training();
    expect(session.getSnapshot().shared.sessionId).toBe('b'.repeat(16));
    expect(random).toHaveBeenCalled();
    session.dispose();
  } finally {
    random.mockRestore();
  }
});

/** Plays the bot strategy through the session's own commands until the game ends. */
function playToEnd(session: TrainingSession) {
  for (let step = 0; step < 1000; step++) {
    const { shared, myId } = session.getSnapshot();
    if (shared.phase !== SessionPhase.Playing) return;
    const move = botMove(shared.game!, myId);
    if (!move) throw new Error('No move');
    if (move.type === ActionType.Roll) session.roll();
    else if (move.type === ActionType.Hold)
      move.held.forEach((h, i) => h !== shared.game!.turn.held[i] && session.toggleHold(i));
    else if (move.type === ActionType.Score) session.score(move.category, move.sheet);
  }

  throw new Error('Game did not finish');
}

test('counts down, then plays a full game alone', () => {
  const session = training();
  const start = session.getSnapshot();
  expect(start.role).toBe(Role.Training);
  expect(start.shared.phase).toBe(SessionPhase.Countdown);
  expect(start.shared.players).toHaveLength(1);
  expect(start.shared.game!.turn.playerId).toBe(start.myId);

  session.roll();
  expect(session.getSnapshot().shared.game!.turn.rollsUsed).toBe(0); // not yet playing

  jest.advanceTimersByTime(TIMING.trainingCountdown);
  expect(session.getSnapshot().shared.phase).toBe(SessionPhase.Playing);

  playToEnd(session);
  const { shared } = session.getSnapshot();
  expect(shared.phase).toBe(SessionPhase.Finished);
  expect(shared.game!.finished).toBe(true);
  expect(shared.game!.history).toHaveLength(13);
  session.dispose();
});

test('"Nochmal spielen" starts a fresh game with the same rules', () => {
  const session = training(PresetId.Yatzy);
  jest.advanceTimersByTime(TIMING.trainingCountdown);
  session.restart(); // ignored while playing
  expect(session.getSnapshot().shared.gameNumber).toBe(1);

  playToEnd(session);
  session.restart();
  const { shared } = session.getSnapshot();
  expect(shared.phase).toBe(SessionPhase.Countdown);
  expect(shared.gameNumber).toBe(2);
  expect(shared.game!.history).toHaveLength(0);
  expect(shared.game!.rules).toEqual(PRESETS[PresetId.Yatzy]);
  session.dispose();
});

test('a mode picked on the results screen applies to the next game', () => {
  const session = training();
  session.setPreset(PresetId.Yatzy); // ignored during the countdown
  expect(session.getSnapshot().shared.preset).toBe(PresetId.Classic);

  jest.advanceTimersByTime(TIMING.trainingCountdown);
  playToEnd(session);
  session.setPreset(PresetId.ClassicXl);
  expect(session.getSnapshot().shared.preset).toBe(PresetId.ClassicXl);
  expect(session.getSnapshot().shared.game!.rules).toEqual(PRESETS[PresetId.Classic]);

  session.restart();
  expect(session.getSnapshot().shared.game!.rules).toEqual(PRESETS[PresetId.ClassicXl]);
  session.dispose();
});

test('with a time limit, the turn is scored automatically', () => {
  const session = training(PresetId.Blitz);
  jest.advanceTimersByTime(TIMING.trainingCountdown);
  jest.advanceTimersByTime(PRESETS[PresetId.Blitz].secondsPerTurn * 1000);
  const [entry] = session.getSnapshot().shared.game!.history;
  expect(entry?.kind).toBe(HistoryKind.AutoScored);
  session.dispose();
});

test('leaving ends the session and stops its timers', () => {
  const session = training(PresetId.Blitz);
  session.leave();
  expect(session.getSnapshot().ended).toBe(EndReason.Left);
  jest.advanceTimersByTime(120_000);
  expect(session.getSnapshot().shared.phase).toBe(SessionPhase.Countdown);
});
