import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, ButtonVariant } from './Button';
import { Card } from './Card';
import { FadeIn } from './FadeIn';
import { Text } from './Text';

const meta: Meta<typeof FadeIn> = {
  title: 'UI/Motion/FadeIn',
  component: FadeIn,
  args: {
    children: (
      <Card>
        <Text>Profil gespeichert.</Text>
      </Card>
    ),
  },
  render: function Replay(args) {
    const [key, setKey] = useState(0);

    return (
      <View style={{ gap: 16 }}>
        <Button
          label="Nochmal"
          onPress={() => setKey((k) => k + 1)}
          variant={ButtonVariant.Secondary}
        />
        <FadeIn key={key} {...args} />
      </View>
    );
  },
};

export default meta;
type Story = StoryObj<typeof FadeIn>;

/** 8 pt up and in over 250 ms. */
export const Default: Story = {};
