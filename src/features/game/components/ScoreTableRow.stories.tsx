import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Animated } from 'react-native';

import { i18n } from '@/i18n';

import { BoardRowKind } from '../view';
import { gameScene } from './fixtures';
import { COLUMN_WIDTH, ScoreTableRow } from './ScoreTableRow';

const NOT_SCROLLED = new Animated.Value(0);

const row = (kind: BoardRowKind) =>
  gameScene(i18n.t, { turns: 20 }).board.rows.find((r) => r.kind === kind)!;

const meta: Meta<typeof ScoreTableRow> = {
  title: 'Features/Game/Scoreboard/ScoreTableRow',
  component: ScoreTableRow,
  args: { columnWidth: COLUMN_WIDTH, labelOffset: NOT_SCROLLED },
};

export default meta;
type Story = StoryObj<typeof ScoreTableRow>;

export const Field: Story = {
  render: (args) => <ScoreTableRow {...args} row={row(BoardRowKind.Field)} />,
};

export const Bonus: Story = {
  render: (args) => <ScoreTableRow {...args} row={row(BoardRowKind.Bonus)} />,
};

export const Total: Story = {
  render: (args) => <ScoreTableRow {...args} row={row(BoardRowKind.Total)} />,
};
