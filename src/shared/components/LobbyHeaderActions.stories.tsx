import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { LobbyHeaderActions } from './LobbyHeaderActions';

const meta: Meta<typeof LobbyHeaderActions> = {
  title: 'Shared/Lobby/LobbyHeaderActions',
  component: LobbyHeaderActions,
  args: { onSettings: fn(), onRules: fn() },
};

export default meta;

export const Default: StoryObj<typeof LobbyHeaderActions> = {};
