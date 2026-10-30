import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { DieFace } from './DieFace';
import { useTheme } from './theme/ThemeProvider';

/** Dice are drawn on the felt in the app. */
function Felt({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        borderRadius: 24,
        backgroundColor: colors.felt,
      }}
    >
      {children}
    </View>
  );
}

const meta: Meta<typeof DieFace> = {
  title: 'UI/Display/DieFace',
  component: DieFace,
  args: { value: 5, size: 56, held: false, tilt: 0, lift: true },
  argTypes: { value: { control: { type: 'range', min: 0, max: 6, step: 1 } } },
  decorators: [
    (Story) => (
      <Felt>
        <Story />
      </Felt>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DieFace>;

export const Default: Story = {};

/** Held dice get the mint ring and lift by 8 pt. */
export const Held: Story = { args: { held: true } };

/** Before the first roll. */
export const Placeholder: Story = { args: { value: 0 } };

export const Faces: Story = {
  render: (args) => (
    <>
      {[1, 2, 3, 4, 5, 6].map((value, i) => (
        <DieFace key={value} {...args} value={value} tilt={[-4, 3, -2, 4, -3, 2][i]} />
      ))}
    </>
  ),
};

/** Tap the die: it shakes and tumbles, then lands on a new face. */
export const Shake: Story = {
  render: function ShakingDie(args) {
    const [roll, setRoll] = useState({ value: args.value, shakeKey: 0 });

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Würfeln"
        onPress={() =>
          setRoll((r) => ({ value: 1 + ((r.value + 2) % 6), shakeKey: r.shakeKey + 1 }))
        }
      >
        <DieFace {...args} value={roll.value} shakeKey={roll.shakeKey} />
      </Pressable>
    );
  },
};
