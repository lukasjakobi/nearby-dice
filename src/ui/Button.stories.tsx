import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Banner } from './Banner';
import { Button, ButtonVariant } from './Button';
import { IconName } from './icons/Icon';
import { useTheme } from './theme/ThemeProvider';

const meta: Meta<typeof Button> = {
  title: 'UI/Actions/Button',
  component: Button,
  args: { label: 'Lobby öffnen', onPress: fn(), variant: ButtonVariant.Primary },
  argTypes: { variant: { control: 'select', options: Object.values(ButtonVariant) } },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Loading: Story = { args: { label: 'Wird sichtbar gemacht …', loading: true } };

export const Disabled: Story = { args: { disabled: true } };

/** The selected ivory raised tile, including its inactive and busy states. */
export const RollTile: Story = {
  args: { label: 'Würfeln', icon: IconName.Dice, variant: ButtonVariant.Roll },
  decorators: [
    function OnFelt(Story) {
      const { colors } = useTheme();

      return (
        <View style={{ padding: 20, gap: 16, backgroundColor: colors.felt }}>
          <Story />
        </View>
      );
    },
  ],
};

export const RollTileDisabled: Story = { ...RollTile, args: { ...RollTile.args, disabled: true } };
export const RollTileLoading: Story = { ...RollTile, args: { ...RollTile.args, loading: true } };

/** Every variant in the place it is used: menu rows start-aligned, the roll button on felt. */
export const Variants: Story = {
  render: (args) => (
    <View style={{ gap: 10 }}>
      <Button {...args} label="Spiel starten" variant={ButtonVariant.Primary} />
      <Button {...args} label="Abbrechen" variant={ButtonVariant.Secondary} />
      <Button {...args} label="Runde beenden" variant={ButtonVariant.Danger} />
      <Button {...args} label="Profil zurücksetzen" variant={ButtonVariant.DangerOutline} />
      <Button {...args} label="Zug überspringen" variant={ButtonVariant.Tonal} alignStart />
      <Button {...args} label="Aus der Lobby entfernen" variant={ButtonVariant.TonalDanger} />
      <Button
        {...args}
        label="Würfeln"
        icon={IconName.Dice}
        variant={ButtonVariant.Roll}
        height={52}
      />
      <Button {...args} label="Eintragen" icon={IconName.Check} variant={ButtonVariant.Accent} />
      <Button {...args} label="Später" variant={ButtonVariant.Quiet} />
      <Button {...args} label="Spiel für alle beenden" variant={ButtonVariant.QuietDanger} />
      <Banner
        message="Verbindung unterbrochen"
        trailing={
          <Button {...args} label="Optionen" variant={ButtonVariant.OnAccent} height={36} />
        }
      />
    </View>
  ),
};
