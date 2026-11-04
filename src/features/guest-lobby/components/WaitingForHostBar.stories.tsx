import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import { WaitingForHostBar } from './WaitingForHostBar';

const meta: Meta<typeof WaitingForHostBar> = {
  title: 'Features/GuestLobby/WaitingForHostBar',
  component: WaitingForHostBar,
  parameters: { screen: true },
  args: { host: { initial: 'A', color: PLAYER_COLOR_HEX[PlayerColor.Sky] } },
};

export default meta;

export const Default: StoryObj<typeof WaitingForHostBar> = {};

/** Before the host's row has arrived. */
export const NoHostYet: StoryObj<typeof WaitingForHostBar> = { args: { host: null } };
