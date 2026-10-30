import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';
import { EndReason } from '@/session';

import { SessionEndedView } from './SessionEndedView';

/** The reasons a guest sees this for; leaving on purpose goes straight home. */
const ended = (reason: Exclude<EndReason, EndReason.Left>) => ({
  title: i18n.t(`errors.sessionEnd.${reason}.title`),
  body: i18n.t(`errors.sessionEnd.${reason}.body`),
});

const meta: Meta<typeof SessionEndedView> = {
  title: 'Features/Session/SessionEndedView',
  component: SessionEndedView,
  parameters: { screen: true },
};

export default meta;
type Story = StoryObj<typeof SessionEndedView>;

export const Kicked: Story = { render: () => <SessionEndedView {...ended(EndReason.Kicked)} /> };

export const LobbyClosed: Story = {
  render: () => <SessionEndedView {...ended(EndReason.LobbyClosed)} />,
};

export const GameEnded: Story = {
  render: () => <SessionEndedView {...ended(EndReason.GameEnded)} />,
};
