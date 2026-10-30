import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ReconnectFailedView } from './ReconnectFailedView';

const meta: Meta<typeof ReconnectFailedView> = {
  title: 'Features/GuestLobby/ReconnectFailedView',
  component: ReconnectFailedView,
  parameters: { screen: true },
  args: { onReconnect: fn(), onGoHome: fn() },
};

export default meta;

export const Default: StoryObj<typeof ReconnectFailedView> = {};
