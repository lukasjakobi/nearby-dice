import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { SheetBackButton } from './SheetBackButton';

const meta: Meta<typeof SheetBackButton> = {
  title: 'Features/Game/SheetBackButton',
  component: SheetBackButton,
  parameters: { screen: true },
  args: { onPress: fn() },
};

export default meta;

/** Above another player's sheet: back to the turn. */
export const Default: StoryObj<typeof SheetBackButton> = {};
