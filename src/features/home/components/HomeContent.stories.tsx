import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { ResumeState } from '../hooks';
import { homeView } from './fixtures';
import { HomeContent } from './HomeContent';

const meta: Meta<typeof HomeContent> = {
  title: 'Features/Home/HomeContent',
  component: HomeContent,
  parameters: { screen: true },
};

export default meta;
type Story = StoryObj<typeof HomeContent>;

/** The start screen of a returning player. */
export const Default: Story = { render: () => <HomeContent home={homeView(i18n.t)} /> };

/** Skipped the profile in onboarding: a card asks for one before playing. */
export const NewPlayer: Story = {
  render: () => <HomeContent home={homeView(i18n.t, { newPlayer: true })} />,
};

/** A game broke off: the banner offers to resume it. */
export const Interrupted: Story = {
  render: () => <HomeContent home={homeView(i18n.t, { interrupted: true })} />,
};

export const Resuming: Story = {
  render: () => (
    <HomeContent home={homeView(i18n.t, { interrupted: true, resume: ResumeState.Searching })} />
  ),
};
