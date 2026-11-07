import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { IconName, useTheme } from '@/ui';

import { SlideButton, SlideTone } from './SlideButton';

const meta: Meta<typeof SlideButton> = {
  title: 'Features/Game/SlideButton',
  component: SlideButton,
  args: { label: 'Würfeln', icon: IconName.Dice, tone: SlideTone.Roll, onCommit: fn() },
  decorators: [
    function OnFelt(Story) {
      const { colors } = useTheme();

      return (
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: colors.felt }}>
          <Story />
        </View>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SlideButton>;

/** Slide the knob to the far end to roll; a tap or a short slide springs back. */
export const Roll: Story = {};

/** Slide to enter the selected field. */
export const Enter: Story = {
  args: { label: 'Eintragen', icon: IconName.Check, tone: SlideTone.Confirm },
};

/** Slide to strike a field worth 0 points. */
export const Strike: Story = {
  args: { label: 'Streichen', icon: IconName.Check, tone: SlideTone.Confirm },
};

/** Entered and waiting for the host: the knob spins and does not slide. */
export const Sending: Story = {
  args: { label: 'Eintragen', icon: IconName.Check, tone: SlideTone.Confirm, busy: true },
};
