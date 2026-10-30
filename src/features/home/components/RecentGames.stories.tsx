import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { recentGames } from './fixtures';
import { RecentGames } from './RecentGames';

const meta: Meta<typeof RecentGames> = {
  title: 'Features/Home/RecentGames',
  component: RecentGames,
};

export default meta;
type Story = StoryObj<typeof RecentGames>;

/** A win and a second place; each row opens the saved game. */
export const Games: Story = { render: () => <RecentGames rows={recentGames(i18n.t)} /> };

export const Empty: Story = { render: () => <RecentGames rows={[]} /> };
