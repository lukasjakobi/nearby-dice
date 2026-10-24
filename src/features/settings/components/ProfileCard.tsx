import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Avatar, Text, TextVariant, useTheme } from '@/ui';
import type { AvatarView } from '@/shared';

/** The profile row at the top of settings: avatar, name and "Bearbeiten". */
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
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        padding: 12,
        paddingRight: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
      }}
    >
      <Avatar initial={avatar.initial} color={avatar.color} size={48} />
      <Text variant={TextVariant.BodyStrong} size={17} style={{ flex: 1 }}>
        {name}
      </Text>
      <Text variant={TextVariant.Label} color="primary">
        {t('settings.edit')}
      </Text>
    </Pressable>
  );
}
