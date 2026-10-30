import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Link } from '@/domain';
import { i18n } from '@/i18n';
import { SessionPhase } from '@/session';
import { ANTONIA, JONAS, LUKAS, snapshot } from '@/test/fixtures';

import { lobbyRows } from '../view/lobbyRows';
import { PlayersSection } from './PlayersSection';

const lobby = (players = [LUKAS, ANTONIA], myId = LUKAS.id) =>
  lobbyRows(snapshot({ players, myId, phase: SessionPhase.Lobby, game: null }));

const freeSeat = () => ({
  title: i18n.t('lobby.freeSeat'),
  hint: i18n.t('lobby.freeSeatHint', { max: 4 }),
});

const meta: Meta<typeof PlayersSection> = {
  title: 'Shared/Lobby/PlayersSection',
  component: PlayersSection,
  args: { rows: lobby(), maxPlayers: 4 },
  // `freeSeat: null` (no free seat) is a story's choice; otherwise the usual free seat.
  render: (args) => (
    <PlayersSection {...args} freeSeat={args.freeSeat === undefined ? freeSeat() : args.freeSeat} />
  ),
};

export default meta;
type Story = StoryObj<typeof PlayersSection>;

/** A guest's view. */
export const GuestLobby: Story = { args: { rows: lobby([LUKAS, ANTONIA], ANTONIA.id) } };

/** The host can remove anyone but themselves. */
export const HostLobby: Story = { args: { onPlayerMenu: fn() } };

export const Alone: Story = {
  args: { rows: lobby([LUKAS]) },
  render: (args) => (
    <PlayersSection {...args} freeSeat={{ title: i18n.t('lobby.waitingTitle'), waiting: true }} />
  ),
};

/** Every seat taken, one player reconnecting. */
export const Full: Story = {
  args: {
    rows: lobby([
      LUKAS,
      ANTONIA,
      { ...JONAS, link: Link.Lost },
      { ...JONAS, id: 'mia', name: 'Mia' },
    ]),
    freeSeat: null,
  },
};
