import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PALETTES, Text, TextVariant } from '@/ui';

import { ScreenOverlay } from './ScreenOverlay';

const meta: Meta<typeof ScreenOverlay> = {
  title: 'Features/Game/ScreenOverlay',
  component: ScreenOverlay,
  parameters: { screen: true },
  args: {
    background: PALETTES.light.primary,
    children: (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant={TextVariant.ScreenTitle} color="onPrimary">
          Über dem ganzen Spiel
        </Text>
      </View>
    ),
  },
};

export default meta;

/** Covers the game screen above the card and the action bar (countdown, lost connection). */
export const Default: StoryObj<typeof ScreenOverlay> = {};
