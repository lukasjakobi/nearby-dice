import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { i18n } from '@/i18n';
import type { TFunction } from '@/i18n';
import { ANTONIA, LUKAS, finishedGame, namedPlayers } from '@/test/fixtures';

import { historyRows } from '../view/historyRows';
import { HistoryItem } from './HistoryItem';

const PLAYERS = [LUKAS, ANTONIA];
const GAME = finishedGame(PLAYERS);
const rows = (t: TFunction) => historyRows(t, GAME, namedPlayers(PLAYERS));

const meta: Meta<typeof HistoryItem> = {
  title: 'Shared/Game/HistoryItem',
  component: HistoryItem,
};

export default meta;
type Story = StoryObj<typeof HistoryItem>;

/** The last entry of a game the bots played to the end. */
export const Entry: Story = { render: () => <HistoryItem row={rows(i18n.t)[0]} /> };

export const List: Story = {
  render: () => (
    <View>
      {rows(i18n.t)
        .slice(0, 6)
        .map((row) => (
          <HistoryItem key={row.seq} row={row} />
        ))}
    </View>
  ),
};
