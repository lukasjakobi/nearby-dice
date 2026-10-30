import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import { ProfileCard } from './ProfileCard';

const meta: Meta<typeof ProfileCard> = {
  title: 'Features/Settings/ProfileCard',
  component: ProfileCard,
  args: {
    name: 'Lukas',
    avatar: { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] },
    onPress: fn(),
  },
};

export default meta;

export const Default: StoryObj<typeof ProfileCard> = {};
