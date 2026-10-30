import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, ButtonVariant } from './Button';
import { Pop } from './Pop';
import { Text } from './Text';
import { Font, fontFamily } from './theme/typography';

const meta: Meta<typeof Pop> = {
  title: 'UI/Motion/Pop',
  component: Pop,
  render: function CountDown() {
    const [n, setN] = useState(3);

    return (
      <View style={{ gap: 16, alignItems: 'center' }}>
        <Pop key={n}>
          <Text size={96} style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: 104 }}>
            {String(n)}
          </Text>
        </Pop>
        <Button
          label="Weiter"
          onPress={() => setN((v) => (v === 1 ? 3 : v - 1))}
          variant={ButtonVariant.Secondary}
        />
      </View>
    );
  },
};

export default meta;

/** Keyed to the value, so every change pops in again (as in the countdown). */
export const Countdown: StoryObj<typeof Pop> = {};
