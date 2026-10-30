import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { ResumeState } from '../hooks';
import { ResumeSheet } from './ResumeSheet';

const meta: Meta<typeof ResumeSheet> = {
  title: 'Features/Home/ResumeSheet',
  component: ResumeSheet,
  parameters: { screen: true },
  args: {
    state: ResumeState.Searching,
    attempt: 2,
    host: 'Antonia',
    round: 7,
    onCancel: fn(),
    onRetry: fn(),
    onEnter: fn(),
  },
  argTypes: { state: { control: 'inline-radio', options: Object.values(ResumeState) } },
};

export default meta;
type Story = StoryObj<typeof ResumeSheet>;

export const Searching: Story = {};

export const Success: Story = { args: { state: ResumeState.Success } };

export const Failed: Story = { args: { state: ResumeState.Failed } };
