import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/ui';

import { LaunchSplash } from './LaunchSplash';

const meta: Meta<typeof LaunchSplash> = {
  title: 'Features/Shell/LaunchSplash',
  component: LaunchSplash,
  parameters: { screen: true },
  // The splash fades after 1.5 s, as at app start; the button brings it back.
  render: function Replay() {
    const [key, setKey] = useState(0);

    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Button label="Nochmal" onPress={() => setKey((k) => k + 1)} />
        <LaunchSplash key={key} />
      </View>
    );
  },
};

export default meta;

export const Default: StoryObj<typeof LaunchSplash> = {};
