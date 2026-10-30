import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { fn } from 'storybook/test';

import { BottomSheet } from './BottomSheet';
import { Button, ButtonVariant } from './Button';
import { Text, TextVariant } from './Text';

const meta: Meta<typeof BottomSheet> = {
  title: 'UI/Feedback/BottomSheet',
  component: BottomSheet,
  parameters: { screen: true },
  args: {
    visible: true,
    onClose: fn(),
    title: 'Antonia',
    children: (
      <>
        <Button
          label="Aus der Lobby entfernen"
          onPress={fn()}
          variant={ButtonVariant.TonalDanger}
          alignStart
        />
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

export const WithTitle: Story = {};

export const LongContent: Story = {
  args: {
    title: 'Spielstand',
    children: (
      <ScrollView style={{ flexGrow: 0 }}>
        {Array.from({ length: 30 }, (_, index) => (
          <Text key={index} variant={TextVariant.Body} color="muted">
            Inhalt des Blatts
          </Text>
        ))}
      </ScrollView>
    ),
  },
};

/** Open it, then drag it down by the handle, flick it or tap the scrim to close it. */
export const Toggle: Story = {
  render: function ToggleSheet(args) {
    const [visible, setVisible] = useState(false);

    return (
      <>
        <Button label="Sheet öffnen" onPress={() => setVisible(true)} />
        <BottomSheet {...args} visible={visible} onClose={() => setVisible(false)} />
      </>
    );
  },
};
