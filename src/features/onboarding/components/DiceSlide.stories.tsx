import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { DiceSlide } from './DiceSlide';

const meta: Meta<typeof DiceSlide> = {
  title: 'Features/Onboarding/DiceSlide',
  component: DiceSlide,
  decorators: [
    (Story) => (
      <View style={{ height: 640, paddingHorizontal: 4 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof DiceSlide> = {};
