import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { PresetId } from '@/domain';
import { i18n } from '@/i18n';
import { ANTONIA, JONAS } from '@/test/fixtures';

import { FieldPick, THREE_FIVES, gameScene } from './fixtures';
import type { Scene } from './fixtures';
import { Scorecard } from './Scorecard';

const sheet = (scene: Scene) => gameScene(i18n.t, scene).view.sheet;

const meta: Meta<typeof Scorecard> = {
  title: 'Features/Game/Scorecard',
  component: Scorecard,
  args: { dimmed: false, onPick: fn(), onSelectSheet: fn() },
  decorators: [
    (Story) => (
      <View style={{ height: 640 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Scorecard>;

/** My turn after a roll: every open field previews its points. */
export const MyTurn: Story = {
  render: (args) => <Scorecard {...args} sheet={sheet({ dice: THREE_FIVES })} />,
};

export const FieldSelected: Story = {
  render: (args) => (
    <Scorecard {...args} sheet={sheet({ dice: THREE_FIVES, selected: FieldPick.Best })} />
  ),
};

/** Before the roll there is nothing to preview. */
export const BeforeRoll: Story = { render: (args) => <Scorecard {...args} sheet={sheet({})} /> };

/** Someone else's turn: their sheet and their previews, nothing to tap. */
export const Waiting: Story = {
  render: (args) => <Scorecard {...args} sheet={sheet({ dice: THREE_FIVES, me: ANTONIA })} />,
};

/** Another player's sheet, opened from the pills. */
export const OtherPlayersSheet: Story = {
  render: (args) => (
    <Scorecard
      {...args}
      sheet={sheet({ me: ANTONIA, local: { viewed: { playerId: JONAS.id, sheetIndex: 0 } } })}
    />
  ),
};

/** "Dreifach": three sheets with ×1 ×2 ×3 tabs. */
export const Triple: Story = {
  render: (args) => (
    <Scorecard {...args} sheet={sheet({ preset: PresetId.Triple, turns: 12, dice: THREE_FIVES })} />
  ),
};

/** Classic XL's longer lower block. */
export const ClassicXl: Story = {
  render: (args) => (
    <Scorecard {...args} sheet={sheet({ preset: PresetId.ClassicXl, dice: THREE_FIVES })} />
  ),
};

/** My connection is down: the card fades until it is back. */
export const Dimmed: Story = {
  args: { dimmed: true },
  render: (args) => <Scorecard {...args} sheet={sheet({ dice: THREE_FIVES })} />,
};
