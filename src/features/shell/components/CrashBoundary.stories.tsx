import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/ui';

import { CrashBoundary } from './CrashBoundary';

function Breakable() {
  const [broken, setBroken] = useState(false);
  if (broken) throw new Error('Story crash');

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Button label="Absturz auslösen" onPress={() => setBroken(true)} />
    </View>
  );
}

const meta: Meta<typeof CrashBoundary> = {
  title: 'Features/Shell/CrashBoundary',
  component: CrashBoundary,
  parameters: { screen: true },
  // The button crashes the screen inside; "Erneut versuchen" brings it back.
  render: () => (
    <CrashBoundary>
      <Breakable />
    </CrashBoundary>
  ),
};

export default meta;

export const Default: StoryObj<typeof CrashBoundary> = {};
