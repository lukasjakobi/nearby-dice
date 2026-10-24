import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ButtonVariant, Card, Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

export function ResumeBanner({
  body,
  onResume,
  onDiscard,
}: {
  body: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Card border="accent" radius={20} padding={16} style={{ borderWidth: 2, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name={IconName.History} color={colors.ink} size={22} strokeWidth={2} />
        <Text variant={TextVariant.CardTitle}>{t('home.resume.title')}</Text>
      </View>
      <Text variant={TextVariant.Body} size={14} color="muted">
        {body}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label={t('home.resume.resume')} onPress={onResume} style={{ flex: 1 }} />
        <Button
          label={t('home.resume.discard')}
          onPress={onDiscard}
          variant={ButtonVariant.Secondary}
        />
      </View>
    </Card>
  );
}
