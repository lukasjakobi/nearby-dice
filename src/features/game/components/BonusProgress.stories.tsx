import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';

import { i18n } from '@/i18n';
import { Button, ButtonVariant } from '@/ui';

import { BonusProgress } from './BonusProgress';

const THRESHOLD = 63;

const bonus = (sum: number) => ({
  label: i18n.t('game.bonus', { points: 35 }),
  progress: i18n.t('game.bonusProgress', { sum, threshold: THRESHOLD }),
  fraction: Math.min(1, sum / THRESHOLD),
  reached: sum >= THRESHOLD,
});

const meta: Meta<typeof BonusProgress> = {
  title: 'Features/Game/BonusProgress',
  component: BonusProgress,
  decorators: [
    (Story) => (
      <View style={{ width: 175 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BonusProgress>;

export const Started: Story = { render: () => <BonusProgress bonus={bonus(21)} /> };

/** Reached: the card turns primary and a check pops in. */
export const Reached: Story = { render: () => <BonusProgress bonus={bonus(71)} /> };

/** Enter fields to watch the fill glide to each new sum. */
export const Filling: Story = {
  render: function Filling() {
    const [sum, setSum] = useState(9);

    return (
      <View style={{ gap: 12 }}>
        <BonusProgress bonus={bonus(sum)} />
        <Button
          label="Feld eintragen"
          onPress={() => setSum((s) => (s >= THRESHOLD ? 9 : s + 12))}
          variant={ButtonVariant.Secondary}
        />
      </View>
    );
  },
};
