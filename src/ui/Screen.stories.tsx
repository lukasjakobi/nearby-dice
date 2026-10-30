import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button } from './Button';
import { Footer } from './Footer';
import { Header } from './Header';
import { IconName } from './icons/Icon';
import { Screen } from './Screen';
import { Text } from './Text';

const meta: Meta<typeof Screen> = {
  title: 'UI/Layout/Screen',
  component: Screen,
  parameters: { screen: true },
  args: {
    children: (
      <>
        <Header
          title="Spiel hosten"
          leading={{ icon: IconName.Back, label: 'Zurück', onPress: fn() }}
        />
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text color="muted">Inhalt scrollt hier; der Footer bleibt unten.</Text>
        </View>
        <Footer>
          <Button label="Lobby öffnen" onPress={fn()} />
        </Footer>
      </>
    ),
  },
  argTypes: { background: { control: 'select', options: ['bg', 'surface', 'primary'] } },
};

export default meta;
type Story = StoryObj<typeof Screen>;

/** Safe-area frame, theme background and the 250 ms fade-in. */
export const Default: Story = {};

export const OnPrimary: Story = { args: { background: 'primary' } };
