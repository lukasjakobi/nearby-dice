import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, ButtonVariant } from './Button';
import { IconName } from './icons/Icon';
import { StatusTone, StatusView } from './StatusView';

const meta: Meta<typeof StatusView> = {
  title: 'UI/Feedback/StatusView',
  component: StatusView,
  parameters: { screen: true },
  args: {
    icon: IconName.Warning,
    tone: StatusTone.Danger,
    title: 'Verbindung verloren',
    body: 'Die Verbindung zum Gastgeber ließ sich nicht wiederherstellen.',
    alert: true,
    actions: (
      <>
        <Button label="Erneut verbinden" onPress={fn()} />
        <Button label="Zur Startseite" onPress={fn()} variant={ButtonVariant.Secondary} />
      </>
    ),
  },
  argTypes: {
    icon: { control: 'select', options: Object.values(IconName) },
    tone: { control: 'inline-radio', options: Object.values(StatusTone) },
  },
  decorators: [
    (Story) => (
      <View style={{ height: 640, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatusView>;

export const Danger: Story = {};

export const Neutral: Story = {
  args: {
    icon: IconName.Bluetooth,
    tone: StatusTone.Neutral,
    title: 'Geräte in der Nähe',
    body: 'Damit sich die Handys finden, braucht die App Zugriff auf Geräte in der Nähe.',
    alert: false,
    actions: <Button label="Erlauben" onPress={fn()} />,
  },
};

export const Success: Story = {
  args: {
    icon: IconName.Check,
    tone: StatusTone.Success,
    title: 'Beigetreten',
    body: undefined,
    alert: false,
    actions: undefined,
  },
};
