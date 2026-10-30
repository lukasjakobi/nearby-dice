import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { RoundCodeCard } from './RoundCodeCard';

const meta: Meta<typeof RoundCodeCard> = {
  title: 'Features/HostLobby/RoundCodeCard',
  component: RoundCodeCard,
  parameters: { screen: true },
  args: { code: '7K4M' },
};

export default meta;

export const Default: StoryObj<typeof RoundCodeCard> = {};
