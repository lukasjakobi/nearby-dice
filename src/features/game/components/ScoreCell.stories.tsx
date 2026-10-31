import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { CellState } from '../view';
import type { CellView } from '../view';
import { THREE_FIVES, gameScene } from './fixtures';
import type { Scene } from './fixtures';
import { ScoreCell } from './ScoreCell';

/** The first cell in `state` of a game in progress, upper block first. */
function cellIn(state: CellState, scene: Scene = { dice: THREE_FIVES }): { cell: CellView } {
  const { sheet } = gameScene(i18n.t, scene).view;

  return {
    cell: (sheet.upper.find((c) => c.state === state) ??
      sheet.lower.find((c) => c.state === state))!,
  };
}

const meta: Meta<typeof ScoreCell> = {
  title: 'Features/Game/ScoreCell',
  component: ScoreCell,
  args: { onPick: fn(), selected: false },
  decorators: [
    (Story) => (
      <View style={{ width: 175, height: 46 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScoreCell>;

/** Entered: grey, ticked, final points. */
export const Filled: Story = {
  render: (args) => <ScoreCell {...args} {...cellIn(CellState.Filled)} />,
};

/** What the dice would score here. */
export const Preview: Story = {
  render: (args) => <ScoreCell {...args} {...cellIn(CellState.Preview)} />,
};

/** Entering here would score 0. */
export const PreviewZero: Story = {
  render: (args) => <ScoreCell {...args} {...cellIn(CellState.PreviewZero)} />,
};

/** Not rolled yet, or someone else's sheet: dashed and empty. */
export const Open: Story = {
  render: (args) => <ScoreCell {...args} {...cellIn(CellState.Open, {})} />,
};

export const Selected: Story = {
  render: (args) => <ScoreCell {...args} {...cellIn(CellState.Preview)} selected />,
};
