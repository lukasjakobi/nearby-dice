import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Feedback/Dialog',
  component: Dialog,
  parameters: { screen: true },
  args: {
    visible: true,
    title: 'Spiel verlassen?',
    body: 'Die anderen spielen ohne dich weiter.',
    confirm: { label: 'Verlassen', onPress: fn() },
    cancel: { label: 'Weiterspielen', onPress: fn() },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {};
