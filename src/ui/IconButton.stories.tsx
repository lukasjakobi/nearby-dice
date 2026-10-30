import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { IconButton } from './IconButton';
import { IconName } from './icons/Icon';

const meta: Meta<typeof IconButton> = {
  title: 'UI/Actions/IconButton',
  component: IconButton,
  args: { icon: IconName.Settings, label: 'Einstellungen', onPress: fn() },
  argTypes: { icon: { control: 'select', options: Object.values(IconName) } },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Plain: Story = {};

/** The start screen header's round button. */
export const Filled: Story = { args: { filled: true, size: 44 } };

export const Disabled: Story = {
  args: { icon: IconName.Refresh, color: 'primary', disabled: true },
};

export const Header: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <IconButton {...args} icon={IconName.Back} label="Zurück" />
      <IconButton {...args} icon={IconName.Menu} label="Menü" />
      <IconButton {...args} icon={IconName.Trophy} label="Spielstand" />
      <IconButton {...args} icon={IconName.More} label="Aktionen" color="muted" size={44} />
      <IconButton {...args} icon={IconName.Close} label="Schließen" filled size={44} />
    </View>
  ),
};
