import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { HostErrorCard } from './HostErrorCard';

const meta: Meta<typeof HostErrorCard> = {
  title: 'Features/HostSetup/HostErrorCard',
  component: HostErrorCard,
};

export default meta;

/** Opening the round failed; the button below offers to try again. */
export const Default: StoryObj<typeof HostErrorCard> = {
  render: () => (
    <HostErrorCard
      error={{
        title: i18n.t('errors.host.bluetooth-off.title'),
        body: i18n.t('errors.host.bluetooth-off.body'),
      }}
    />
  ),
};
