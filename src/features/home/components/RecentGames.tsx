import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import {
  Avatar,
  Card,
  Font,
  fontFamily,
  Icon,
  IconName,
  Section,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';

import type { RecentRow } from '../hooks';

export function RecentGames({ rows }: { rows: RecentRow[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Section title={t('home.recentTitle')}>
      {rows.length === 0 ? (
        <Card dashed radius={16} padding={16}>
          <Text variant={TextVariant.Body} size={14} color="muted">
            {t('home.recentEmpty')}
          </Text>
        </Card>
      ) : (
        rows.map((row) => (
          <Pressable
            key={row.id}
            onPress={row.onPress}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface,
            }}
          >
            <Avatar initial={String(row.place)} color={row.badge} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant={TextVariant.Label} size={15} numberOfLines={1}>
                {row.opponents}
              </Text>
              <Text variant={TextVariant.Caption} color="muted">
                {row.when}
              </Text>
            </View>
            <Text size={20} style={{ fontFamily: fontFamily(Font.Display, 600) }}>
              {String(row.points)}
            </Text>
            <Icon name={IconName.ChevronRight} color={colors.muted} size={18} strokeWidth={2.4} />
          </Pressable>
        ))
      )}
    </Section>
  );
}
