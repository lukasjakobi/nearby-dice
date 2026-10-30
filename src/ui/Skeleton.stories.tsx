import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Display/Skeleton',
  component: Skeleton,
  args: { height: 64 },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Row: Story = {};

/** Rounds nearby while the scan has found nothing yet. */
export const List: Story = {
  render: (args) => (
    <View style={{ gap: 8 }}>
      <Skeleton {...args} />
      <Skeleton {...args} />
    </View>
  ),
};
