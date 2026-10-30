import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { CodeSlide } from './CodeSlide';

const meta: Meta<typeof CodeSlide> = {
  title: 'Features/Onboarding/CodeSlide',
  component: CodeSlide,
  decorators: [
    (Story) => (
      <View style={{ height: 640, paddingHorizontal: 4 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof CodeSlide> = {};
