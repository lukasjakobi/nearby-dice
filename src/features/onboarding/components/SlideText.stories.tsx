import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { i18n } from '@/i18n';

import { SlideText } from './SlideText';

const meta: Meta<typeof SlideText> = {
  title: 'Features/Onboarding/SlideText',
  component: SlideText,
};

export default meta;
type Story = StoryObj<typeof SlideText>;

export const TitleAndBody: Story = {
  render: () => (
    <SlideText
      title={i18n.t('onboarding.slides.dice.title')}
      body={i18n.t('onboarding.slides.dice.body')}
    />
  ),
};

export const TitleOnly: Story = {
  render: () => <SlideText title={i18n.t('onboarding.slides.profile.title')} body="" />,
};
