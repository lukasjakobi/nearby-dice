import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from './Button';
import { useToast } from './Toast';

/** The canvas already wraps every story in the app's `ToastProvider`. */
function ShowToast({ message }: { message: string }) {
  const toast = useToast();

  return <Button label="Toast zeigen" onPress={() => toast.show(message)} />;
}

const meta: Meta<typeof ShowToast> = {
  title: 'UI/Feedback/Toast',
  component: ShowToast,
  parameters: { screen: true },
  args: { message: 'Antonia ist beigetreten.' },
};

export default meta;

/** Press the button; the toast shows for 3.2 s above the bottom edge. */
export const Default: StoryObj<typeof ShowToast> = {};
