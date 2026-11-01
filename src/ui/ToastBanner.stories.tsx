import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ToastBanner } from './ToastBanner';

const meta: Meta<typeof ToastBanner> = {
  title: 'UI/Feedback/ToastBanner',
  component: ToastBanner,
  parameters: { screen: true },
  args: { message: 'Antonia ist beigetreten.', visible: true, onExited: () => {} },
};

export default meta;

/** The card as the toast shows it, dropped in below the status bar. */
export const Default: StoryObj<typeof ToastBanner> = {};
