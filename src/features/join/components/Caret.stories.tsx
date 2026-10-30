import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Caret } from './Caret';

const meta: Meta<typeof Caret> = {
  title: 'Features/Join/Caret',
  component: Caret,
};

export default meta;

/** Blinks once a second; stays on with reduce motion. */
export const Default: StoryObj<typeof Caret> = {};
