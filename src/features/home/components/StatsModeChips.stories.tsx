import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { modeChips } from './fixtures';
import { StatsModeChips } from './StatsModeChips';

const meta: Meta<typeof StatsModeChips> = {
  title: 'Features/Home/StatsModeChips',
  component: StatsModeChips,
};

export default meta;
type Story = StoryObj<typeof StatsModeChips>;

/** Every mode together; the row scrolls sideways. */
export const All: Story = { render: () => <StatsModeChips chips={modeChips(i18n.t)} /> };

export const OneMode: Story = { render: () => <StatsModeChips chips={modeChips(i18n.t, 2)} /> };
