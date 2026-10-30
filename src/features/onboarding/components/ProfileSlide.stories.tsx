import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PlayerColor } from '@/domain';
import { useProfileForm } from '@/shared';

import { ProfileSlide } from './ProfileSlide';

const meta: Meta<typeof ProfileSlide> = {
  title: 'Features/Onboarding/ProfileSlide',
  component: ProfileSlide,
};

export default meta;
type Story = StoryObj<typeof ProfileSlide>;

/** The real form: type a name and pick a colour; the avatar follows. */
export const Empty: Story = {
  render: function NewProfile() {
    return <ProfileSlide form={useProfileForm(null)} />;
  },
};

export const Filled: Story = {
  render: function ExistingProfile() {
    return <ProfileSlide form={useProfileForm({ name: 'Antonia', color: PlayerColor.Sky })} />;
  },
};
