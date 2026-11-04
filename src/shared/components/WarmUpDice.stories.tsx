import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { WarmUpDice } from './WarmUpDice';

const meta: Meta<typeof WarmUpDice> = {
  title: 'Shared/Dice/WarmUpDice',
  component: WarmUpDice,
};

export default meta;

/** Tap a die to re-roll just that one. */
export const Default: StoryObj<typeof WarmUpDice> = {};
