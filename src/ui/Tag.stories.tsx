import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'UI/Display/Tag',
  component: Tag,
  args: { label: 'Gastgeber', background: 'accent', color: 'onAccent' },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Host: Story = {};

export const You: Story = { args: { label: 'Du', background: 'surface2', color: 'ink' } };

export const Together: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <Tag label="Gastgeber" background="accent" color="onAccent" />
      <Tag label="Du" background="surface2" color="ink" />
    </View>
  ),
};
