import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { GameMenuSheet } from './GameMenuSheet';

const meta: Meta<typeof GameMenuSheet> = {
  title: 'Features/Game/GameMenuSheet',
  component: GameMenuSheet,
  parameters: { screen: true },
  args: { visible: true, onToggle: fn(), onVolume: fn(), onContinue: fn(), onLeave: fn() },
};

export default meta;
type Story = StoryObj<typeof GameMenuSheet>;

const menu = (leaveLabel: string) => ({
  leaveLabel,
  switches: [
    { key: 'sound' as const, label: i18n.t('settings.sound'), value: true, volume: 0.8 },
    { key: 'music' as const, label: i18n.t('settings.music'), value: true, volume: 0.4 },
    { key: 'haptics' as const, label: i18n.t('settings.haptics'), value: false },
  ],
});

/** The host ends the game for everyone. */
export const Host: Story = {
  render: (args) => <GameMenuSheet {...args} {...menu(i18n.t('game.leaveHost'))} />,
};

export const Guest: Story = {
  render: (args) => <GameMenuSheet {...args} {...menu(i18n.t('game.leaveGuest'))} />,
};

export const Training: Story = {
  render: (args) => <GameMenuSheet {...args} {...menu(i18n.t('game.leaveTraining'))} />,
};
