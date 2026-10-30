import { mix } from '@/ui';
import type { Palette } from '@/ui';

import { BarPart } from '../view';

/** Fill and label colour of each share of a standings bar; the legend uses the fills. */
export const BAR_COLORS: Record<BarPart, (c: Palette) => { fill: string; label: string }> = {
  [BarPart.Upper]: (c) => ({ fill: c.primary, label: c.onPrimary }),
  [BarPart.Bonus]: (c) => ({ fill: c.accent, label: c.onAccent }),
  [BarPart.Lower]: (c) => ({ fill: mix(c.ink, c.surface2, 0.82), label: c.bg }),
};
