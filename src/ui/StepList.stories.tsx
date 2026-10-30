import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { StepList, StepState } from './StepList';

const meta: Meta<typeof StepList> = {
  title: 'UI/Display/StepList',
  component: StepList,
  args: {
    steps: [
      { key: 'search', label: 'Runde suchen', state: StepState.Done },
      { key: 'secure', label: 'Sichere Verbindung aufbauen', state: StepState.Active },
      { key: 'join', label: 'Beitreten', state: StepState.Upcoming },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof StepList>;

export const InProgress: Story = {};

export const AllDone: Story = {
  args: {
    steps: [
      { key: 'search', label: 'Runde suchen', state: StepState.Done },
      { key: 'secure', label: 'Sichere Verbindung aufbauen', state: StepState.Done },
      { key: 'join', label: 'Beitreten', state: StepState.Done },
    ],
  },
};
