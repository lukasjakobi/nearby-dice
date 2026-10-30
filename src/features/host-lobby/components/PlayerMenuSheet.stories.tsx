import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PlayerMenuSheet } from './PlayerMenuSheet';

const meta: Meta<typeof PlayerMenuSheet> = {
  title: 'Features/HostLobby/PlayerMenuSheet',
  component: PlayerMenuSheet,
  parameters: { screen: true },
  args: { visible: true, title: 'Antonia', onKick: fn(), onClose: fn() },
};

export default meta;

export const Default: StoryObj<typeof PlayerMenuSheet> = {};
