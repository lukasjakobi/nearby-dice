import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { WaitingForHostBar } from './WaitingForHostBar';

const meta: Meta<typeof WaitingForHostBar> = {
  title: 'Features/GuestLobby/WaitingForHostBar',
  component: WaitingForHostBar,
  parameters: { screen: true },
};

export default meta;

export const Default: StoryObj<typeof WaitingForHostBar> = {};
