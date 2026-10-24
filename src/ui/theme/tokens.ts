import { PlayerColor } from '@/domain';

export enum ColorScheme {
  Light = 'light',
  Dark = 'dark',
}

export type Palette = {
  /** Screen background. */
  bg: string;
  /** Cards, inputs, sheets. */
  surface: string;
  /** Segmented controls, filled cells, bonus card. */
  surface2: string;
  ink: string;
  muted: string;
  /** Borders, tracks. */
  line: string;
  primary: string;
  onPrimary: string;
  /** Roll button, held-die ring, focus ring. */
  accent: string;
  onAccent: string;
  danger: string;
  onDanger: string;
  /** Connected, success. */
  ok: string;
  /** Dice tray, action bar. */
  felt: string;
  /** Behind dialogs and sheets. */
  scrim: string;
};

export type ColorToken = keyof Palette;

/**
 * "Graphit & Mint" from the design canvas (07 Spielzug dunkel – 5). Dark is copied
 * verbatim; light is its daylight counterpart with the same graphite tray and coral.
 */
export const PALETTES: Record<ColorScheme, Palette> = {
  [ColorScheme.Light]: {
    bg: '#F3F5F6',
    surface: '#FFFFFF',
    surface2: '#E6EAEC',
    ink: '#15191C',
    muted: '#5B656B',
    line: '#D5DBDE',
    primary: '#0B7A65',
    onPrimary: '#FFFFFF',
    accent: '#FF9E7A',
    onAccent: '#3A1405',
    danger: '#B3261E',
    onDanger: '#FFFFFF',
    ok: '#0B7A65',
    felt: '#1F302D',
    scrim: 'rgba(16,18,20,0.5)',
  },
  [ColorScheme.Dark]: {
    bg: '#101214',
    surface: '#181B1E',
    surface2: '#22262A',
    ink: '#ECEFF1',
    muted: '#9AA3A9',
    line: '#2F353A',
    primary: '#4FE3C1',
    onPrimary: '#032820',
    accent: '#FF9E7A',
    onAccent: '#3A1405',
    danger: '#FF8A80',
    onDanger: '#3A0B07',
    ok: '#4FE3C1',
    felt: '#1F302D',
    scrim: 'rgba(0,0,0,0.65)',
  },
};

/** The only hard-coded colours outside the palette (same in both themes). */
export const FIXED = {
  dieFace: '#F2F5F4',
  diePip: '#101214',
  dieEdge: '#B7C0BD',
  heldRing: '#4FE3C1',
  /** Text on player colours and on the felt. */
  onPlayer: '#101214',
  onFelt: '#ECF7F4',
  timeLow: '#FF8A80',
  /** Badge for places below first in "Zuletzt gespielt". */
  silver: '#CFC6B0',
  /** Graphite, for the splash and launcher icon (outside any theme). */
  brand: '#101214',
} as const;

export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  [PlayerColor.Amber]: '#E0A33A',
  [PlayerColor.Mint]: '#7FD6A0',
  [PlayerColor.Sky]: '#8EC5F0',
  [PlayerColor.Coral]: '#F29E9E',
  [PlayerColor.Lilac]: '#C3A6F0',
  [PlayerColor.Yellow]: '#F2D45C',
};

export const RADIUS = {
  chip: 12,
  cell: 14,
  button: 16,
  card: 18,
  dialog: 24,
  sheet: 28,
  pill: 999,
} as const;

export const SIZE = { buttonHeight: 52, touch: 44, iconButton: 48 } as const;

/** Mixes `color` into `base` (like CSS color-mix in sRGB). Accepts #RRGGBB. */
export function mix(color: string, base: string, amount: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const a = parse(color);
  const b = parse(base);
  const channel = (i: number) => Math.round(a[i] * amount + b[i] * (1 - amount));

  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`;
}

/** `color` with alpha, for #RRGGBB inputs. */
export function alpha(color: string, opacity: number): string {
  const value = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return `${color}${value}`;
}
