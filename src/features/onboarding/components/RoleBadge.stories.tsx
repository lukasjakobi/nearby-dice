import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import { RoleBadge } from './RoleBadge';

const meta: Meta<typeof RoleBadge> = {
  title: 'Features/Onboarding/RoleBadge',
  component: RoleBadge,
  args: { initial: 'L', color: PLAYER_COLOR_HEX[PlayerColor.Amber] },
  render: (args) => (
    <View style={{ margin: 24, height: 80, borderRadius: 20, borderWidth: 2 }}>
      <RoleBadge {...args} />
    </View>
  ),
};

export default meta;

/** On the corner of the host's code card. */
export const Default: StoryObj<typeof RoleBadge> = {};
