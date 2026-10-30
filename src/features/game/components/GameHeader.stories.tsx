import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { GameHeader } from './GameHeader';

const meta: Meta<typeof GameHeader> = {
  title: 'Features/Game/GameHeader',
  component: GameHeader,
  parameters: { screen: true },
  args: { onMenu: fn(), onScoreboard: fn() },
};

export default meta;

export const Default: StoryObj<typeof GameHeader> = {
  render: (args) => <GameHeader {...args} roundLabel={i18n.t('game.round', { n: 4, total: 13 })} />,
};
