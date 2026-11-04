import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ScanPulse } from './ScanPulse';

const meta: Meta<typeof ScanPulse> = {
  title: 'Features/Join/ScanPulse',
  component: ScanPulse,
  args: { label: 'Suche läuft' },
};

export default meta;

/** "In deiner Nähe" while nothing has turned up yet. */
export const Default: StoryObj<typeof ScanPulse> = {};
