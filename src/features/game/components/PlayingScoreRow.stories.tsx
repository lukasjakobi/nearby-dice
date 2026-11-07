import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';
import { RADIUS } from '@/ui';

import { CellState } from '../view';
import type { CellView } from '../view';
import { THREE_FIVES, gameScene } from './fixtures';
import type { Scene } from './fixtures';
import { PlayingScoreRow } from './PlayingScoreRow';

/** The first cell in `state` of a game in progress, upper block first. */
function cellIn(state: CellState, scene: Scene = { dice: THREE_FIVES }): { cell: CellView } {
  const { sheet } = gameScene(i18n.t, scene).view;

  return {
    cell: (sheet.upper.find((c) => c.state === state) ??
      sheet.lower.find((c) => c.state === state))!,
  };
}

const meta: Meta<typeof PlayingScoreRow> = {
  title: 'Features/Game/PlayingScoreRow',
  component: PlayingScoreRow,
  args: { onPick: fn(), selected: false },
  decorators: [
    (Story) => (
      <View style={{ width: 175 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlayingScoreRow>;

/** Entered points. */
export const Filled: Story = {
  render: (args) => <PlayingScoreRow {...args} {...cellIn(CellState.Filled)} />,
};

/** What the dice would score here. */
export const Preview: Story = {
  render: (args) => <PlayingScoreRow {...args} {...cellIn(CellState.Preview)} />,
};

/** Entering here would score 0. */
export const PreviewZero: Story = {
  render: (args) => <PlayingScoreRow {...args} {...cellIn(CellState.PreviewZero)} />,
};

/** No preview before rolling or when browsing entries. */
export const Open: Story = {
  render: (args) => <PlayingScoreRow {...args} {...cellIn(CellState.Open, {})} />,
};

export const Selected: Story = {
  render: (args) => <PlayingScoreRow {...args} {...cellIn(CellState.Preview)} selected />,
};

/** Extra height on a taller phone increases the target and score type. */
export const Expanded: Story = {
  args: { rowHeight: 64 },
  render: (args) => <PlayingScoreRow {...args} {...cellIn(CellState.Preview)} />,
};

/** Last in its rounded column, like Chance: the selection follows the column's rounded bottom corners. */
export const SelectedLast: Story = {
  render: (args) => (
    <View style={{ borderRadius: RADIUS.chip, overflow: 'hidden' }}>
      <PlayingScoreRow {...args} {...cellIn(CellState.Preview)} selected last />
    </View>
  ),
};
