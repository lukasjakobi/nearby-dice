import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Countdown } from './Countdown';

const COUNTDOWN_MS = 3500;

const meta: Meta<typeof Countdown> = {
  title: 'Shared/Lobby/Countdown',
  component: Countdown,
  parameters: { screen: true },
  // `endsAt` is a clock time, so it is set when the story renders; tap to start over.
  render: function Replay() {
    const [endsAt, setEndsAt] = useState(() => Date.now() + COUNTDOWN_MS);

    return (
      <Pressable
        accessible={false}
        onPress={() => setEndsAt(Date.now() + COUNTDOWN_MS)}
        style={{ flex: 1 }}
      >
        <Countdown endsAt={endsAt} />
      </Pressable>
    );
  },
};

export default meta;

/** "3, 2, 1, Los!" before the first turn; sounds are off in Storybook. */
export const Default: StoryObj<typeof Countdown> = {};
