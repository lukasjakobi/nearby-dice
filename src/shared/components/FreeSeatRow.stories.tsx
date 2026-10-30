import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { FreeSeatRow } from './FreeSeatRow';

const meta: Meta<typeof FreeSeatRow> = {
  title: 'Shared/Lobby/FreeSeatRow',
  component: FreeSeatRow,
};

export default meta;
type Story = StoryObj<typeof FreeSeatRow>;

export const FreeSeat: Story = {
  render: () => (
    <FreeSeatRow title={i18n.t('lobby.freeSeat')} hint={i18n.t('lobby.freeSeatHint', { max: 4 })} />
  ),
};

/** The host is alone: a spinner instead of the plus. */
export const Waiting: Story = {
  render: () => <FreeSeatRow title={i18n.t('lobby.waitingTitle')} waiting />,
};
