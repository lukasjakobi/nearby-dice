import { useTranslation } from 'react-i18next';

import { Avatar, ListGroup, ListRow } from '@/ui';
import type { AvatarView } from '@/shared';

/** The profile row at the top of settings: avatar, name and "Bearbeiten", all one tap. */
export function ProfileCard({
  name,
  avatar,
  onPress,
}: {
  name: string;
  avatar: AvatarView;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ListGroup>
      <ListRow
        title={name}
        subtitle={t('settings.edit')}
        subtitleColor="primary"
        leading={<Avatar initial={avatar.initial} color={avatar.color} size={48} />}
        onPress={onPress}
      />
    </ListGroup>
  );
}
