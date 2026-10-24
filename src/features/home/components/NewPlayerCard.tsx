import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, IconName, Text, TextVariant, useTheme } from '@/ui';

export function NewPlayerCard({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Card
      dashed
      radius={24}
      padding={20}
      style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}
    >
      <Icon name={IconName.User} color={colors.primary} size={52} strokeWidth={1.6} />
      <Text variant={TextVariant.DialogTitle}>{t('home.newPlayer.title')}</Text>
      <Text
        variant={TextVariant.Body}
        size={14}
        color="muted"
        align="center"
        style={{ maxWidth: 280 }}
      >
        {t('home.newPlayer.body')}
      </Text>
      <Button
        label={t('home.newPlayer.action')}
        onPress={onCreate}
        style={{ alignSelf: 'stretch' }}
      />
    </Card>
  );
}
