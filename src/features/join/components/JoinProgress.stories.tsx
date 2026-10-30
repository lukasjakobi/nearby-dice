import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { JoinStep } from '@/session';

import { JoinProgress } from './JoinProgress';

const meta: Meta<typeof JoinProgress> = {
  title: 'Features/Join/JoinProgress',
  component: JoinProgress,
  parameters: { screen: true },
  args: { code: '7K4M', step: JoinStep.Search },
  argTypes: { step: { control: 'inline-radio', options: Object.values(JoinStep) } },
};

export default meta;
type Story = StoryObj<typeof JoinProgress>;

export const Searching: Story = {};

export const Securing: Story = { args: { step: JoinStep.Secure } };

export const Joining: Story = { args: { step: JoinStep.Join } };
