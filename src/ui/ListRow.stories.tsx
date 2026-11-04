import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { IconBadge } from './IconBadge';
import { IconName } from './icons/Icon';
import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';

const meta: Meta<typeof ListRow> = {
  title: 'UI/Layout/ListRow',
  component: ListRow,
  args: {
    title: 'Geräte in der Nähe',
    subtitle: 'Erlaubt',
    subtitleColor: 'ok',
    leading: <IconBadge icon={IconName.Bluetooth} color="#076356" />,
  },
  render: (args) => (
    <ListGroup>
      <ListRow {...args} />
    </ListGroup>
  ),
};

export default meta;
type Story = StoryObj<typeof ListRow>;

export const Static: Story = {};

/** Pressable without a trailing control: a chevron says it leads somewhere. */
export const Pressable: Story = { args: { onPress: fn() } };

/** "Statistik zurücksetzen" in the settings. */
export const Danger: Story = {
  args: {
    title: 'Statistik zurücksetzen',
    titleColor: 'danger',
    subtitle: undefined,
    leading: <IconBadge icon={IconName.Trash} color="#B3261E" />,
    onPress: fn(),
  },
};
