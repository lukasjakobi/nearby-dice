import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Avatar, useTheme } from '@/ui';
import type { AvatarView } from '@/shared';

/** The player's avatar in the header; the greeting below already says their name. */
export function ProfileChip({
  name,
  avatar,
  onPress,
}: {
  name: string;
  avatar: AvatarView;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.editProfile', { name })}
      style={{
        padding: 2,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: avatar.color,
        backgroundColor: colors.bg,
      }}
    >
      <Avatar initial={avatar.initial} color={avatar.color} size={40} />
    </Pressable>
  );
}
