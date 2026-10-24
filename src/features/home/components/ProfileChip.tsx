import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Avatar, Text, TextVariant, useTheme } from '@/ui';
import type { AvatarView } from '@/shared';

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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        paddingVertical: 2,
        paddingLeft: 2,
        paddingRight: 14,
        borderRadius: 999,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Avatar initial={avatar.initial} color={avatar.color} size={40} />
      <Text variant={TextVariant.Label} size={15}>
        {name}
      </Text>
    </Pressable>
  );
}
