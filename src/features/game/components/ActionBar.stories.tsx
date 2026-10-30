import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';
import { ANTONIA } from '@/test/fixtures';

import { ActionBar } from './ActionBar';
import { FieldPick, THREE_FIVES, gameScene } from './fixtures';
import type { Scene } from './fixtures';

const NO_SHAKE = [0, 0, 0, 0, 0];

/** The bar for a scene; `confirm` mirrors the game screen's strip for the selected field. */
function bar(scene: Scene, timer = false) {
  const { view } = gameScene(i18n.t, scene);
  const cell = view.selectedCell;

  return {
    dice: view.dice,
    control: view.control,
    timer: timer ? { deadline: Date.now() + 22_000, limitMs: 30_000, lowMs: 10_000 } : null,
    confirm: cell
      ? {
          label: cell.label,
          points: i18n.t('format.points', { count: Number(cell.value) }),
          strike: Number(cell.value) === 0,
          sending: false,
        }
      : null,
  };
}

const meta: Meta<typeof ActionBar> = {
  title: 'Features/Game/ActionBar',
  component: ActionBar,
  parameters: { screen: true },
  args: { shakeKeys: NO_SHAKE, onToggleHold: fn(), onRoll: fn(), onConfirm: fn() },
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActionBar>;

/** My turn, nothing rolled yet: placeholder dice and "Würfeln". */
export const BeforeRoll: Story = { render: (args) => <ActionBar {...args} {...bar({})} /> };

/** After the first roll: tap dice to hold them. */
export const Rolled: Story = {
  render: (args) => <ActionBar {...args} {...bar({ dice: THREE_FIVES })} />,
};

/** A field is selected: the dice lock into a frame and the button enters the points. */
export const FieldSelected: Story = {
  render: (args) => (
    <ActionBar {...args} {...bar({ dice: THREE_FIVES, selected: FieldPick.Best })} />
  ),
};

/** Selecting a field that scores 0 offers to strike it. */
export const Strike: Story = {
  render: (args) => (
    <ActionBar {...args} {...bar({ dice: THREE_FIVES, selected: FieldPick.Zero })} />
  ),
};

/** Someone else's turn: their rolls and who is playing replace the button. */
export const Waiting: Story = {
  render: (args) => <ActionBar {...args} {...bar({ dice: THREE_FIVES, me: ANTONIA })} />,
};

export const WithTimer: Story = {
  render: (args) => <ActionBar {...args} {...bar({ dice: THREE_FIVES }, true)} />,
};
