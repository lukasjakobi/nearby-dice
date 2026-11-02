import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ButtonVariant, Card, StatusTone, Text, TextVariant } from '@/ui';
import type { ColorToken } from '@/ui';

import { UpdateAction } from '../view';
import type { UpdateView } from '../view';

const TONE_COLORS: Record<StatusTone, ColorToken> = {
  [StatusTone.Neutral]: 'muted',
  [StatusTone.Success]: 'ok',
  [StatusTone.Danger]: 'danger',
};

const ACTION_VARIANTS: Record<UpdateAction, ButtonVariant> = {
  [UpdateAction.Check]: ButtonVariant.Secondary,
  [UpdateAction.Install]: ButtonVariant.Primary,
};

/** The installed version with "check for updates", and the download once a newer release exists. */
export function UpdateCard({
  version,
  update,
  onAction,
}: {
  version: string | undefined;
  update: UpdateView;
  onAction: (action: UpdateAction) => void;
}) {
  const { t } = useTranslation();
  const { message, button } = update;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ gap: 2 }}>
        <Text variant={TextVariant.Body} size={16} weight={500}>
          {t('settings.version')} {version}
        </Text>
        {message ? (
          <Text
            variant={TextVariant.Label}
            color={TONE_COLORS[message.tone]}
            accessibilityRole={message.alert ? 'alert' : undefined}
            accessibilityLiveRegion="polite"
          >
            {message.text}
          </Text>
        ) : null}
      </View>
      {button ? (
        <Button
          label={button.label}
          onPress={() => onAction(button.action)}
          variant={ACTION_VARIANTS[button.action]}
          loading={button.loading}
          height={48}
        />
      ) : null}
    </Card>
  );
}
