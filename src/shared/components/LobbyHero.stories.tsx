import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PresetId } from '@/domain';

import { LobbyHero } from './LobbyHero';

const meta: Meta<typeof LobbyHero> = {
  title: 'Shared/Lobby/LobbyHero',
  component: LobbyHero,
  args: { code: 'N2JZ', preset: PresetId.Classic, onRules: fn() },
};

export default meta;
type Story = StoryObj<typeof LobbyHero>;

/** The host can change the mode from the card. */
export const Host: Story = { args: { onChangePreset: fn() } };

/** Guests see the same card; the mode opens the rules. */
export const Guest: Story = {};

export const LongMode: Story = { args: { preset: PresetId.TopToBottom, onChangePreset: fn() } };
