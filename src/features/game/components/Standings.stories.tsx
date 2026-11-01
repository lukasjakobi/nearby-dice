import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { i18n } from '@/i18n';

import { SIX_PLAYERS, gameScene } from './fixtures';
import { Standings } from './Standings';
import type { PlayerBoard } from '../view';

const meta: Meta<typeof Standings> = {
  title: 'Features/Game/Scoreboard/Standings',
  component: Standings,
  decorators: [
    (Story) => (
      <View style={{ width: 350 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Standings>;

function Picker({ players }: { players: PlayerBoard[] }) {
  const [selected, setSelected] = useState(players[0].id);

  return (
    <Standings
      label={i18n.t('game.players')}
      players={players}
      selected={selected}
      onSelect={setSelected}
    />
  );
}

export const ThreePlayers: Story = {
  render: () => <Picker players={gameScene(i18n.t, { turns: 20 }).board.players} />,
};

/** Six players: two rows of three. */
export const SixPlayers: Story = {
  render: () => (
    <Picker players={gameScene(i18n.t, { players: SIX_PLAYERS, turns: 30 }).board.players} />
  ),
};

/** Before the first points nobody wears the crown. */
export const FirstRound: Story = {
  render: () => <Picker players={gameScene(i18n.t, { turns: 0 }).board.players} />,
};
