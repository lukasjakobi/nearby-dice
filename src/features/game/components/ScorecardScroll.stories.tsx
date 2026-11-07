import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { PresetId } from '@/domain';
import { i18n } from '@/i18n';

import { THREE_FIVES, gameScene } from './fixtures';
import { Scorecard } from './Scorecard';
import { ScorecardScroll } from './ScorecardScroll';

const card = (availableHeight: number, preset = PresetId.Classic) => (
  <Scorecard
    playing
    availableHeight={availableHeight}
    sheet={gameScene(i18n.t, { preset, dice: THREE_FIVES }).view.sheet}
    dimmed={false}
    onPick={fn()}
    onSelectSheet={fn()}
  />
);

const meta: Meta<typeof ScorecardScroll> = {
  title: 'Features/Game/ScorecardScroll',
  component: ScorecardScroll,
  parameters: { screen: true },
};

export default meta;
type Story = StoryObj<typeof ScorecardScroll>;

/** Enough room to show every row. */
export const Fits: Story = {
  render: () => (
    <View style={{ height: 640 }}>
      <ScorecardScroll>{(height) => card(height)}</ScorecardScroll>
    </View>
  ),
};

/** A small phone: the lower fields scroll into view. */
export const SmallPhone: Story = {
  render: () => (
    <View style={{ height: 380 }}>
      <ScorecardScroll>{(height) => card(height, PresetId.ClassicXl)}</ScorecardScroll>
    </View>
  ),
};
