import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { EndReason } from '@/session';

import { SessionEndedView } from './SessionEndedView';

const meta: Meta<typeof SessionEndedView> = {
  title: 'Features/Session/SessionEndedView',
  component: SessionEndedView,
  parameters: { screen: true },
};

export default meta;
type Story = StoryObj<typeof SessionEndedView>;

export const Kicked: Story = { args: { reason: EndReason.Kicked } };

export const LobbyClosed: Story = { args: { reason: EndReason.LobbyClosed } };

export const GameEnded: Story = { args: { reason: EndReason.GameEnded } };
