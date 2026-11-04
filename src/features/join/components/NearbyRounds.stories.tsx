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
    hostName: 'Lukas',
    initial: 'L',
    color: PLAYER_COLOR_HEX[PlayerColor.Amber],
    players: 2,
    maxPlayers: 4,
    full: false,
  },
  {
    endpointId: 'b',
    code: 'Q2XD',
    hostName: 'Mia',
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
  args: { rounds: ROUNDS, error: false, onJoin: fn(), onRetry: fn() },
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

/** Nothing found yet: the radar pulses for as long as the search runs. */
export const Searching: Story = { args: { rounds: [] } };

export const OneRound: Story = { args: { rounds: ROUNDS.slice(0, 1) } };

/** The search could not start: the radar gives way to the error and a retry. */
export const ScanFailed: Story = { args: { rounds: [], error: true } };
