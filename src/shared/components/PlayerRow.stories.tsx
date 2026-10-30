import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PlayerColor } from '@/domain';
import { i18n } from '@/i18n';
import { PLAYER_COLOR_HEX } from '@/ui';

import { PlayerRow, PlayerTag, RowStatus } from './PlayerRow';
import type { PlayerRowView } from './PlayerRow';

const ANTONIA: PlayerRowView = {
  id: 'antonia',
  name: 'Antonia',
  avatar: { initial: 'A', color: PLAYER_COLOR_HEX[PlayerColor.Sky] },
  tags: [],
  status: RowStatus.Connected,
};

const meta: Meta<typeof PlayerRow> = {
  title: 'Shared/Lobby/PlayerRow',
  component: PlayerRow,
  args: { row: ANTONIA },
};

export default meta;
type Story = StoryObj<typeof PlayerRow>;

export const Guest: Story = {};

export const Host: Story = {
  args: {
    row: {
      id: 'lukas',
      name: 'Lukas',
      avatar: { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] },
      tags: [PlayerTag.Host],
      status: RowStatus.Connected,
    },
  },
};

export const You: Story = {
  args: { row: { ...ANTONIA, tags: [PlayerTag.You] } },
};

/** Lost the connection: red border, dimmed avatar, spinner. */
export const Reconnecting: Story = {
  args: { row: { ...ANTONIA, status: RowStatus.Reconnecting } },
};

/** The host lobby shows a ⋯ menu on guests' rows. */
export const WithMenu: Story = {
  args: { onMenu: fn() },
  render: (args) => (
    <PlayerRow {...args} menuLabel={i18n.t('lobby.playerActions', { name: 'Antonia' })} />
  ),
};
