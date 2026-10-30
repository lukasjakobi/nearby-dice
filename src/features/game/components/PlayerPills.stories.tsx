import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
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

export const TwoPlayers: Story = {
  render: (args) => <PlayerPills {...args} pills={pills({ players: SIX_PLAYERS.slice(0, 2) })} />,
};

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

/** A narrow phone keeps all six players in one compact row. */
export const SixPlayersNarrow: Story = {
  render: (args) => (
    <View style={{ width: 320, maxWidth: '100%' }}>
      <PlayerPills {...args} pills={pills({ players: SIX_PLAYERS, turns: 14 })} />
    </View>
  ),
};

/** Long names truncate, but even a four-digit total stays inside its pill. */
export const LongNamesAndTotals: Story = {
  render: (args) => (
    <PlayerPills
      {...args}
      pills={pills({ players: SIX_PLAYERS, turns: 14 }).map((pill) => ({
        ...pill,
        name: `${pill.name} ${pill.name}`,
        total: 1234,
      }))}
    />
  ),
};
