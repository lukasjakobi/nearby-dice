/**
 * Geometry of the waving "YATZY!" (design canvas, 10 Yatzy-Flagge), in points on the
 * design's 390 pt wide phone. Each letter rides a sine wave across the word and is
 * shaded by the slope beneath it, like a fold in the cloth.
 */
export const STAGE_WIDTH = 390;
export const LETTER_BOX = 130;
export const FONT_SIZE = 94;

const WORD_WIDTH = 350;
/** Advance of each glyph as a share of the font size; the word is spaced by hand. */
const ADVANCE: Record<string, number> = { Y: 0.66, A: 0.7, T: 0.58, Z: 0.6, '!': 0.3 };
const DEFAULT_ADVANCE = 0.62;
const LETTER_GAP = 0.03;

/** 1.1 crests across the word, 16 pt high. */
const CRESTS = 1.1;
const AMPLITUDE = 16;
/** A fold falling to the right darkens a letter, a rising one lights it. */
const DARK_PER_SLOPE = 0.8;
const LIGHT_PER_SLOPE = 0.6;
/** Points per wave period; the native driver interpolates linearly between them. */
const SAMPLES = 24;

/** One swing of the cloth takes this long. */
export const WAVE_MS = 1250;
/** With reduce motion the flag rests at this point of its swing, half as high. */
export const STILL_PHASE = 0.9 / (2 * Math.PI);
export const STILL_SWING = 0.5;

/** Stacked layers that make the letters look solid, from the back. */
export const EXTRUSION = [6, 5, 4, 3, 2, 1].map((k) => ({ x: k * 1.5, y: k * 2.3 }));
export const DROP_SHADOW = { x: 11, y: 17 };

export type FlagGlyph = {
  char: string;
  /** Centre, from the middle of the word. */
  offset: number;
  /** Centre, as a share of the word's width. */
  along: number;
};

export function layoutFlagWord(word: string): FlagGlyph[] {
  const chars = [...word];
  const gap = LETTER_GAP * FONT_SIZE;
  const advances = chars.map((char) => (ADVANCE[char] ?? DEFAULT_ADVANCE) * FONT_SIZE);
  const total = advances.reduce((sum, advance) => sum + advance, 0) + gap * (chars.length - 1);
  let x = (WORD_WIDTH - total) / 2;

  return chars.map((char, i) => {
    const centre = x + advances[i]! / 2;
    x += advances[i]! + gap;

    return {
      char,
      offset: centre - WORD_WIDTH / 2,
      along: Math.min(1, Math.max(0, centre / WORD_WIDTH)),
    };
  });
}

/** Wave phase from 0 to 1, sampled for `interpolate`. */
export const WAVE_PHASES = Array.from({ length: SAMPLES + 1 }, (_, i) => i / SAMPLES);

/** Lift and shading of one glyph over a full swing, at full height. */
export function glyphWave({ along }: FlagGlyph) {
  const angles = WAVE_PHASES.map((phase) => 2 * Math.PI * (CRESTS * along - phase));
  const slopes = angles.map(
    (angle) => ((AMPLITUDE * 2 * Math.PI * CRESTS) / WORD_WIDTH) * Math.cos(angle),
  );

  return {
    lift: angles.map((angle) => AMPLITUDE * Math.sin(angle)),
    dark: slopes.map((slope) => Math.max(0, slope * DARK_PER_SLOPE)),
    light: slopes.map((slope) => Math.max(0, -slope * LIGHT_PER_SLOPE)),
  };
}
