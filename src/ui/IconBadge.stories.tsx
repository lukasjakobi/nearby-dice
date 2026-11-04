import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { IconBadge } from './IconBadge';
import { IconName } from './icons/Icon';

const meta: Meta<typeof IconBadge> = {
  title: 'UI/Display/IconBadge',
  component: IconBadge,
  args: { icon: IconName.Bluetooth, color: '#076356' },
};

export default meta;
type Story = StoryObj<typeof IconBadge>;

export const Default: Story = {};

/** The big one on top of a sheet or an empty state. */
export const Hero: Story = { args: { size: 72 } };

export const Solid: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <IconBadge {...args} solid onColor="#FFFFFF" />
      <IconBadge {...args} icon={IconName.Bolt} color="#D9623F" solid onColor="#2B0E03" />
    </View>
  ),
};
