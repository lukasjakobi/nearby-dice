import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { homeView } from './fixtures';
import { ResumeBanner } from './ResumeBanner';

const meta: Meta<typeof ResumeBanner> = {
  title: 'Features/Home/ResumeBanner',
  component: ResumeBanner,
  args: { onResume: fn(), onDiscard: fn() },
};

export default meta;

export const Default: StoryObj<typeof ResumeBanner> = {
  render: (args) => (
    <ResumeBanner {...args} body={homeView(i18n.t, { interrupted: true }).interrupted!.body} />
  ),
};
