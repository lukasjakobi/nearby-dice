import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { buildUpdateView, UpdateStatus } from '../view';
import type { UpdateState } from '../view';

import { UpdateCard } from './UpdateCard';

const IDLE: UpdateState = { status: UpdateStatus.Idle };

const meta: Meta<typeof UpdateCard> = {
  title: 'Features/Settings/UpdateCard',
  component: UpdateCard,
  args: { version: '1.2.0', update: buildUpdateView(i18n.t, IDLE), onAction: fn() },
};

export default meta;
type Story = StoryObj<typeof UpdateCard>;

// Built at render time, so the story follows the language toolbar.
const inState = (state: UpdateState): Story => ({
  render: (args) => <UpdateCard {...args} update={buildUpdateView(i18n.t, state)} />,
});

export const Idle = inState(IDLE);

export const Checking = inState({ status: UpdateStatus.Checking });

export const UpToDate = inState({ status: UpdateStatus.UpToDate });

export const Available = inState({ status: UpdateStatus.Available, version: '1.3.0' });

export const Downloading = inState({
  status: UpdateStatus.Downloading,
  version: '1.3.0',
  percent: 42,
});

export const CheckFailed = inState({ status: UpdateStatus.CheckFailed });

export const DownloadFailed = inState({ status: UpdateStatus.DownloadFailed, version: '1.3.0' });
