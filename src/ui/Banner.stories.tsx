import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Banner } from './Banner';
import { Text } from './Text';

const meta: Meta<typeof Banner> = {
  title: 'UI/Feedback/Banner',
  component: Banner,
  args: { message: 'Verbindung unterbrochen', busy: true },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Reconnecting: Story = {
  args: {
    trailing: (
      <Text size={13} weight={600} color="onAccent">
        Versuch 2 von 3
      </Text>
    ),
  },
};

export const Still: Story = { args: { message: 'Antonia ist nicht erreichbar', busy: false } };
