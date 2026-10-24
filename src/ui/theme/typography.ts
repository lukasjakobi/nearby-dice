import { Platform } from 'react-native';
import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans';

export enum Font {
  /** Fredoka: titles, numbers, the round code. */
  Display = 'display',
  /** Work Sans: everything else. */
  Body = 'body',
}

export type FontWeight = 400 | 500 | 600 | 700;

export const FONT_ASSETS = {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
};

const FAMILIES: Record<Font, Record<FontWeight, keyof typeof FONT_ASSETS>> = {
  [Font.Display]: {
    400: 'Fredoka_500Medium',
    500: 'Fredoka_500Medium',
    600: 'Fredoka_600SemiBold',
    700: 'Fredoka_700Bold',
  },
  [Font.Body]: {
    400: 'WorkSans_400Regular',
    500: 'WorkSans_500Medium',
    600: 'WorkSans_600SemiBold',
    700: 'WorkSans_600SemiBold',
  },
};

let systemFontFallback = false;

export function setSystemFontFallback(enabled: boolean): void {
  systemFontFallback = enabled;
}

/** Custom fonts ship one file per weight, so the weight picks the family. */
export function fontFamily(font: Font, weight: FontWeight): string {
  return systemFontFallback
    ? (Platform.select({ ios: 'System', default: 'sans-serif' }) ?? 'sans-serif')
    : FAMILIES[font][weight];
}

/** The text styles in use (spec: titles 26/20, body 16, labels 14–16, captions 12–13). */
export enum TextVariant {
  Hero = 'hero',
  ScreenTitle = 'screen-title',
  DialogTitle = 'dialog-title',
  SectionTitle = 'section-title',
  CardTitle = 'card-title',
  Body = 'body',
  BodyStrong = 'body-strong',
  Label = 'label',
  Caption = 'caption',
  Small = 'small',
}

type VariantStyle = { font: Font; size: number; weight: FontWeight; lineHeight?: number };

export const TEXT_VARIANTS: Record<TextVariant, VariantStyle> = {
  [TextVariant.Hero]: { font: Font.Display, size: 30, weight: 600, lineHeight: 35 },
  [TextVariant.ScreenTitle]: { font: Font.Display, size: 26, weight: 600, lineHeight: 31 },
  [TextVariant.DialogTitle]: { font: Font.Display, size: 22, weight: 600, lineHeight: 27 },
  [TextVariant.SectionTitle]: { font: Font.Display, size: 20, weight: 600, lineHeight: 25 },
  [TextVariant.CardTitle]: { font: Font.Display, size: 19, weight: 600, lineHeight: 24 },
  [TextVariant.Body]: { font: Font.Body, size: 15, weight: 400, lineHeight: 22 },
  [TextVariant.BodyStrong]: { font: Font.Body, size: 16, weight: 600, lineHeight: 22 },
  [TextVariant.Label]: { font: Font.Body, size: 14, weight: 600, lineHeight: 19 },
  [TextVariant.Caption]: { font: Font.Body, size: 13, weight: 400, lineHeight: 18 },
  [TextVariant.Small]: { font: Font.Body, size: 12, weight: 500, lineHeight: 16 },
};

/** Dynamic Type support up to 130 % (spec). */
export const MAX_FONT_SCALE = 1.3;
