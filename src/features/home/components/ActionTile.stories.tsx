import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';
import { IconName } from '@/ui';

import { ActionTile } from './ActionTile';

const meta: Meta<typeof ActionTile> = {
  title: 'Features/Home/ActionTile',
  component: ActionTile,
  args: { icon: IconName.Broadcast, primary: true, onPress: fn() },
  decorators: [
    (Story) => (
      <View style={{ flexDirection: 'row', width: 175 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActionTile>;

export const Host: Story = {
  render: (args) => <ActionTile {...args} label={i18n.t('home.host')} />,
};

export const Join: Story = {
  args: { icon: IconName.Search, primary: false },
  render: (args) => <ActionTile {...args} label={i18n.t('home.join')} />,
};
