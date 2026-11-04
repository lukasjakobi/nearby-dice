import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Avatar } from './Avatar';
import { IconBadge } from './IconBadge';
import { IconName } from './icons/Icon';
import { ListGroup } from './ListGroup';
import { ListRow } from './ListRow';
import { Switch } from './Switch';
import { Text } from './Text';

const meta: Meta<typeof ListGroup> = {
  title: 'UI/Layout/ListGroup',
  component: ListGroup,
};

export default meta;
type Story = StoryObj<typeof ListGroup>;

/** As in the settings: a badge per row, a switch or a chevron on the right. */
export const Settings: Story = {
  render: () => (
    <ListGroup inset={62}>
      <ListRow
        title="Töne"
        leading={<IconBadge icon={IconName.Sound} color="#D9623F" />}
        trailing={<Switch value onChange={fn()} label="Töne" />}
      />
      <ListRow
        title="Geräte in der Nähe"
        subtitle="Erlaubt"
        subtitleColor="ok"
        leading={<IconBadge icon={IconName.Bluetooth} color="#076356" />}
        onPress={fn()}
      />
    </ListGroup>
  ),
};

/** As in the lobbies: avatars and a value on the right. */
export const Players: Story = {
  render: () => (
    <ListGroup inset={68}>
      <ListRow
        title="Lukas"
        leading={<Avatar initial="L" color="#E0A33A" size={40} />}
        trailing={<Text weight={600}>Gastgeber</Text>}
      />
      <ListRow title="Antonia" leading={<Avatar initial="A" color="#8EC5F0" size={40} />} />
    </ListGroup>
  ),
};
