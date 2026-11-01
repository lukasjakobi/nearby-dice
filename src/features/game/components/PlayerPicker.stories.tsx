import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { i18n } from '@/i18n';

import { SIX_PLAYERS, gameScene } from './fixtures';
import { PlayerPicker } from './PlayerPicker';
import type { PlayerBoard } from '../view';

const meta: Meta<typeof PlayerPicker> = {
  title: 'Features/Game/Scoreboard/PlayerPicker',
  component: PlayerPicker,
  decorators: [
    (Story) => (
      <View style={{ width: 320 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlayerPicker>;

function Picker({ players }: { players: PlayerBoard[] }) {
  const [selected, setSelected] = useState(players[0].id);

  return (
    <PlayerPicker
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

/** Six players wrap onto a second line. */
export const SixPlayers: Story = {
  render: () => (
    <Picker players={gameScene(i18n.t, { players: SIX_PLAYERS, turns: 30 }).board.players} />
  ),
};
