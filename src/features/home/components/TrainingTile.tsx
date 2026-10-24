import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { FIXED, Font, fontFamily, Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

/** "Training": a wide row under the two tiles for playing alone. */
export function TrainingTile({ hint, onPress }: { hint: string; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('home.training')}, ${hint}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 72,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        transform: [{ translateY: pressed ? 1 : 0 }],
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: colors.felt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={IconName.Target} color={FIXED.onFelt} size={24} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text size={20} style={{ fontFamily: fontFamily(Font.Display, 600), lineHeight: 26 }}>
          {t('home.training')}
        </Text>
        <Text variant={TextVariant.Caption} color="muted" numberOfLines={1}>
          {hint}
        </Text>
      </View>
      <Icon name={IconName.ChevronRight} color={colors.ink} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}
