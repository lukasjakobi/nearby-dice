import type { PlayerId } from './engine';

/** The six profile swatches. Hex values live in the UI theme, labels in i18n. */
export enum PlayerColor {
  Amber = 'amber',
  Mint = 'mint',
  Sky = 'sky',
  Coral = 'coral',
  Lilac = 'lilac',
  Yellow = 'yellow',
}

export const PLAYER_COLORS: readonly PlayerColor[] = [
  PlayerColor.Amber,
  PlayerColor.Mint,
  PlayerColor.Sky,
  PlayerColor.Coral,
  PlayerColor.Lilac,
  PlayerColor.Yellow,
];

export type Profile = { name: string; color: PlayerColor };
/** A seat in a game with the profile its player used. */
export type NamedPlayer = Profile & { id: PlayerId };

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 16;
export const ROUND_NAME_MAX_LENGTH = 24;

export enum NameProblem {
  Empty = 'empty',
  TooShort = 'too-short',
}

export function validateName(name: string): NameProblem | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return NameProblem.Empty;
  if (trimmed.length < NAME_MIN_LENGTH) return NameProblem.TooShort;

  return null;
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function isPlayerColor(value: unknown): value is PlayerColor {
  return PLAYER_COLORS.includes(value as PlayerColor);
}
