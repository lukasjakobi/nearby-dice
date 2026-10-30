import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { ANTONIA, LUKAS } from '@/test/fixtures';
import { Button } from '@/ui';

import { yatzyFlag } from './fixtures';
import { YatzyFlag } from './YatzyFlag';

const meta: Meta<typeof YatzyFlag> = {
  title: 'Features/Game/YatzyFlag',
  component: YatzyFlag,
  parameters: { screen: true },
};

export default meta;
type Story = StoryObj<typeof YatzyFlag>;

/** The flag closes after about three seconds or on a tap; then wave it again. */
function Replay({ player }: { player: typeof LUKAS }) {
  const [shown, setShown] = useState(1);

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      {shown ? (
        <YatzyFlag key={shown} flag={yatzyFlag(player)} onClose={() => setShown(0)} />
      ) : (
        <Button label="Nochmal" onPress={() => setShown(Date.now())} />
      )}
    </View>
  );
}

export const Amber: Story = { render: () => <Replay player={LUKAS} /> };

export const Sky: Story = { render: () => <Replay player={ANTONIA} /> };
