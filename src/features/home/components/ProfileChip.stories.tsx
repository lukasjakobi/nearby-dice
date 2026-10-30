import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import { ProfileChip } from './ProfileChip';

const meta: Meta<typeof ProfileChip> = {
  title: 'Features/Home/ProfileChip',
  component: ProfileChip,
  args: {
    name: 'Antonia',
    avatar: { initial: 'A', color: PLAYER_COLOR_HEX[PlayerColor.Sky] },
    onPress: fn(),
  },
  decorators: [
    (Story) => (
      <View style={{ alignItems: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof ProfileChip> = {};
