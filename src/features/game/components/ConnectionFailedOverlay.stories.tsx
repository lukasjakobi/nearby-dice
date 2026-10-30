import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ConnectionFailedOverlay } from './ConnectionFailedOverlay';

const meta: Meta<typeof ConnectionFailedOverlay> = {
  title: 'Features/Game/ConnectionFailedOverlay',
  component: ConnectionFailedOverlay,
  parameters: { screen: true },
  args: { onReconnect: fn(), onGoHome: fn() },
};

export default meta;

export const Default: StoryObj<typeof ConnectionFailedOverlay> = {};
