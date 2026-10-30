import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Logo } from './Logo';
import { FIXED, PALETTES } from './theme/tokens';

const meta: Meta<typeof Logo> = {
  title: 'UI/Display/Logo',
  component: Logo,
  args: { size: 104, body: PALETTES.light.felt, pips: FIXED.dieFace, label: 'Nearby Dice' },
};

export default meta;
type Story = StoryObj<typeof Logo>;

/** On the start screen: the tray colour with light pips. */
export const Home: Story = {};

/** On the graphite splash: light dice with dark pips. */
export const Splash: Story = { args: { body: FIXED.dieFace, pips: FIXED.brand } };
