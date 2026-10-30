import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { PlayerColor } from '@/domain';
import { PLAYER_COLOR_HEX } from '@/ui';

import type { NearbyRoundView } from '../hooks';
import { NearbyRounds } from './NearbyRounds';

const ROUNDS: NearbyRoundView[] = [
  {
    endpointId: 'a',
    code: '7K4M',
    roundName: 'Lukas’ Runde',
    initial: 'L',
    color: PLAYER_COLOR_HEX[PlayerColor.Amber],
    players: 2,
    maxPlayers: 4,
    full: false,
  },
  {
    endpointId: 'b',
    code: 'Q2XD',
    roundName: 'Spieleabend bei Mia',
    initial: 'M',
    color: PLAYER_COLOR_HEX[PlayerColor.Mint],
    players: 6,
    maxPlayers: 6,
    full: true,
  },
];

const meta: Meta<typeof NearbyRounds> = {
  title: 'Features/Join/NearbyRounds',
  component: NearbyRounds,
  args: { rounds: ROUNDS, scanning: false, error: false, onJoin: fn(), onRefresh: fn() },
  decorators: [
    (Story) => (
      <View style={{ height: 360 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NearbyRounds>;

/** A round with free seats and a full one. */
export const Found: Story = {};

/** Scanning with nothing found yet: two skeleton rows. */
export const Scanning: Story = { args: { rounds: [], scanning: true } };

export const ScanningWithResults: Story = { args: { rounds: ROUNDS.slice(0, 1), scanning: true } };

export const NothingNearby: Story = { args: { rounds: [] } };

export const ScanFailed: Story = { args: { rounds: [], error: true } };
