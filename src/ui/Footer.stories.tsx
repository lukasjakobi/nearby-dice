import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Button, ButtonVariant } from './Button';
import { Footer } from './Footer';
import { Text, TextVariant } from './Text';

const meta: Meta<typeof Footer> = {
  title: 'UI/Layout/Footer',
  component: Footer,
  parameters: { screen: true },
  args: {
    children: (
      <>
        <Text variant={TextVariant.Caption} color="muted" align="center">
          Es kann losgehen.
        </Text>
        <Button label="Spiel starten" onPress={fn()} />
        <Button label="Lobby schließen" onPress={fn()} variant={ButtonVariant.Secondary} />
      </>
    ),
  },
};

export default meta;

export const Default: StoryObj<typeof Footer> = {};
