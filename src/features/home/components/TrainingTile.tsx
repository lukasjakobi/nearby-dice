import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import {
  alpha,
  EDGE,
  FIXED,
  Font,
  fontFamily,
  Icon,
  IconName,
  Text,
  TextVariant,
  shade,
  useTheme,
} from '@/ui';

/** "Training": a wide tile on the felt under the two big ones, for playing alone. */
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
        backgroundColor: colors.felt,
        borderBottomWidth: pressed ? 1 : EDGE,
        borderBottomColor: shade(colors.felt, 0.4),
        transform: [{ translateY: pressed ? EDGE - 1 : 0 }],
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: alpha(FIXED.onFelt, 0.12),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={IconName.Target} color={FIXED.onFelt} size={24} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          size={20}
          color={{ raw: FIXED.onFelt }}
          style={{ fontFamily: fontFamily(Font.Display, 600), lineHeight: 26 }}
        >
          {t('home.training')}
        </Text>
        <Text
          variant={TextVariant.Caption}
          color={{ raw: FIXED.onFelt }}
          numberOfLines={1}
          style={{ opacity: 0.75 }}
        >
          {hint}
        </Text>
      </View>
      <Icon name={IconName.ChevronRight} color={FIXED.onFelt} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}
