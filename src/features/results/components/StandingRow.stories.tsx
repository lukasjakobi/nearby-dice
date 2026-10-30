import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { finished } from './fixtures';
import { StandingRow } from './StandingRow';

const row = (place: number) => finished(i18n.t).standings.rows[place];

const meta: Meta<typeof StandingRow> = {
  title: 'Features/Results/StandingRow',
  component: StandingRow,
};

export default meta;
type Story = StoryObj<typeof StandingRow>;

/** Crown instead of a place, tinted in the accent. */
export const Winner: Story = { render: () => <StandingRow row={row(0)} index={0} /> };

export const RunnerUp: Story = { render: () => <StandingRow row={row(1)} index={1} /> };

export const Last: Story = { render: () => <StandingRow row={row(2)} index={2} /> };
