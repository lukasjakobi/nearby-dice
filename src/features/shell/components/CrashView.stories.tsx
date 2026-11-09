import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { CrashView } from './CrashView';

const meta: Meta<typeof CrashView> = {
  title: 'Features/Shell/CrashView',
  component: CrashView,
  parameters: { screen: true },
  args: { onRetry: fn(), onHome: fn() },
};

export default meta;

export const Default: StoryObj<typeof CrashView> = {};
