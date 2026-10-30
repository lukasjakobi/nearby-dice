import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';
import { ANTONIA, JONAS } from '@/test/fixtures';

import { SIX_PLAYERS, gameScene } from './fixtures';
import { PlayerPills } from './PlayerPills';
import type { Scene } from './fixtures';

const pills = (scene: Scene) => gameScene(i18n.t, scene).view.pills;

const meta: Meta<typeof PlayerPills> = {
  title: 'Features/Game/PlayerPills',
  component: PlayerPills,
  parameters: { screen: true },
  args: { onSelect: fn() },
};

export default meta;
type Story = StoryObj<typeof PlayerPills>;

/** The player whose turn it is has the primary border. */
export const MyTurn: Story = { render: (args) => <PlayerPills {...args} pills={pills({})} /> };

/** Jonas's sheet opened from the pills: his pill is tinted in his colour. */
export const ViewingOther: Story = {
  render: (args) => (
    <PlayerPills
      {...args}
      pills={pills({ me: ANTONIA, local: { viewed: { playerId: JONAS.id, sheetIndex: 0 } } })}
    />
  ),
};

export const SixPlayers: Story = {
  render: (args) => <PlayerPills {...args} pills={pills({ players: SIX_PLAYERS, turns: 14 })} />,
};
