import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Button, ButtonVariant } from './Button';
import { IconButton } from './IconButton';
import { IconName } from './icons/Icon';
import { Sheet } from './Sheet';
import { Text, TextVariant } from './Text';

const meta: Meta<typeof Sheet> = {
  title: 'UI/Feedback/Sheet',
  component: Sheet,
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
        <Button label="Schließen" onPress={fn()} variant={ButtonVariant.Secondary} />
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const WithTitle: Story = {};

export const WithCloseButton: Story = {
  args: {
    title: 'Spielstand',
    height: '60%',
    titleAccessory: <IconButton icon={IconName.Close} label="Schließen" onPress={fn()} filled />,
    children: (
      <Text variant={TextVariant.Body} color="muted">
        Inhalt des Blatts
      </Text>
    ),
  },
};

/** Open and close it to see the spring and the fade. */
export const Toggle: Story = {
  render: function ToggleSheet(args) {
    const [visible, setVisible] = useState(false);

    return (
      <>
        <Button label="Sheet öffnen" onPress={() => setVisible(true)} />
        <Sheet {...args} visible={visible} onClose={() => setVisible(false)} />
      </>
    );
  },
};
