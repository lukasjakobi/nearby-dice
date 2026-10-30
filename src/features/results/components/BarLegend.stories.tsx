import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { BarPart } from '../view';
import { BarLegend } from './BarLegend';

const meta: Meta<typeof BarLegend> = {
  title: 'Features/Results/BarLegend',
  component: BarLegend,
  args: { parts: [BarPart.Upper, BarPart.Bonus, BarPart.Lower] },
};

export default meta;
type Story = StoryObj<typeof BarLegend>;

export const WithBonus: Story = {};

/** Rules without the upper bonus. */
export const WithoutBonus: Story = { args: { parts: [BarPart.Upper, BarPart.Lower] } };
