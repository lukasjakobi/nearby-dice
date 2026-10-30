import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { FeedbackSettingsSheet } from './FeedbackSettingsSheet';

const meta: Meta<typeof FeedbackSettingsSheet> = {
  title: 'Shared/Settings/FeedbackSettingsSheet',
  component: FeedbackSettingsSheet,
  parameters: { screen: true },
  args: { visible: true, onToggle: fn(), onVolume: fn(), onClose: fn() },
  render: (args) => (
    <FeedbackSettingsSheet
      {...args}
      rows={[
        { key: 'sound', label: i18n.t('settings.sound'), value: true, volume: 0.8 },
        { key: 'music', label: i18n.t('settings.music'), value: false, volume: 0.5 },
        { key: 'haptics', label: i18n.t('settings.haptics'), value: true },
      ]}
    />
  ),
};

export default meta;

/** "Einstellungen" from a lobby. */
export const Default: StoryObj<typeof FeedbackSettingsSheet> = {};
