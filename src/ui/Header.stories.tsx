import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Button, ButtonVariant } from './Button';
import { Header } from './Header';
import { IconName } from './icons/Icon';
import { TextVariant } from './Text';

const meta: Meta<typeof Header> = {
  title: 'UI/Layout/Header',
  component: Header,
  parameters: { screen: true },
  args: {
    title: 'Einstellungen',
    leading: { icon: IconName.Back, label: 'Zurück', onPress: fn() },
  },
  argTypes: { variant: { control: 'select', options: Object.values(TextVariant) } },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Back: Story = {};

export const Close: Story = {
  args: { title: 'Profil', leading: { icon: IconName.Close, label: 'Schließen', onPress: fn() } },
};

export const WithAction: Story = {
  args: {
    title: 'Lukas’ Runde',
    leading: { icon: IconName.Close, label: 'Lobby schließen', onPress: fn() },
    trailing: (
      <Button
        label="Regeln"
        onPress={fn()}
        variant={ButtonVariant.Secondary}
        height={44}
        style={{ paddingHorizontal: 14, borderRadius: 12 }}
      />
    ),
  },
};
