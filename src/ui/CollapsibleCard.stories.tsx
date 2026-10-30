import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';
import { View } from 'react-native';

import { CollapsibleCard } from './CollapsibleCard';
import { Text } from './Text';

const meta: Meta<typeof CollapsibleCard> = {
  title: 'UI/Layout/CollapsibleCard',
  component: CollapsibleCard,
  args: {
    title: 'Alle Felder im Vergleich',
    children: (
      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
        <Text color="muted">Erst sichtbar, wenn die Karte aufgeklappt ist.</Text>
      </View>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof CollapsibleCard>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));
  },
};
