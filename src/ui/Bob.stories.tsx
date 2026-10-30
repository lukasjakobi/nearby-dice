import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Bob } from './Bob';
import { Logo } from './Logo';
import { FIXED, PALETTES } from './theme/tokens';

const meta: Meta<typeof Bob> = {
  title: 'UI/Motion/Bob',
  component: Bob,
  args: {
    tilt: -8,
    distance: 6,
    delayMs: 0,
    children: <Logo size={72} body={PALETTES.light.felt} pips={FIXED.dieFace} />,
  },
};

export default meta;

/** A slow float; it stays still with reduce motion. */
export const Default: StoryObj<typeof Bob> = {};
