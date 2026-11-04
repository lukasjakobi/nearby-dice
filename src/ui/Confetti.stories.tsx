import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Confetti } from './Confetti';
import { Text, TextVariant } from './Text';

const meta: Meta<typeof Confetti> = {
  title: 'UI/Display/Confetti',
  component: Confetti,
  render: (args) => (
    <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
      <Confetti {...args} />
      <Text variant={TextVariant.Hero}>Du gewinnst!</Text>
    </View>
  ),
};

export default meta;
type Story = StoryObj<typeof Confetti>;

/** Behind the winner on the results screen. */
export const Default: Story = {};

export const Large: Story = { args: { scale: 1.5 } };
