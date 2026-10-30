import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import { HomeHeader } from './HomeHeader';

const meta: Meta<typeof HomeHeader> = {
  title: 'Features/Home/HomeHeader',
  component: HomeHeader,
  parameters: { screen: true },
  args: {
    profile: {
      name: 'Lukas',
      avatar: { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] },
    },
    onOpenSettings: fn(),
    onEditProfile: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof HomeHeader>;

export const WithProfile: Story = {};

export const WithoutProfile: Story = { args: { profile: null } };
