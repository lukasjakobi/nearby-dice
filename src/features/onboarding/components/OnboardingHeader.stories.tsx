import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { OnboardingSlide } from '../hooks';
import { OnboardingHeader } from './OnboardingHeader';

const SLIDES = [OnboardingSlide.Dice, OnboardingSlide.Code, OnboardingSlide.Profile];

const meta: Meta<typeof OnboardingHeader> = {
  title: 'Features/Onboarding/OnboardingHeader',
  component: OnboardingHeader,
  parameters: { screen: true },
  args: {
    slide: OnboardingSlide.Dice,
    slides: SLIDES,
    canGoBack: false,
    canSkip: true,
    onBack: fn(),
    onSkip: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingHeader>;

export const FirstSlide: Story = {};

export const SecondSlide: Story = { args: { slide: OnboardingSlide.Code, canGoBack: true } };

/** The profile slide: no skipping past it. */
export const LastSlide: Story = {
  args: { slide: OnboardingSlide.Profile, canGoBack: true, canSkip: false },
};
