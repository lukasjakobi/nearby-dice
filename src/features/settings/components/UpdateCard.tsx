import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Button,
  ButtonVariant,
  IconBadge,
  IconName,
  ListGroup,
  ListRow,
  StatusTone,
  useTheme,
} from '@/ui';
import type { ColorToken } from '@/ui';

import { UpdateAction } from '../view';
import type { UpdateView } from '../view';

const TONE_COLORS: Record<StatusTone, ColorToken> = {
  [StatusTone.Neutral]: 'muted',
  [StatusTone.Success]: 'ok',
  [StatusTone.Danger]: 'danger',
};

/** Checking is a quiet chore; installing a newer version is the one thing to do here. */
const ACTION_VARIANTS: Record<UpdateAction, ButtonVariant> = {
  [UpdateAction.Check]: ButtonVariant.Tonal,
  [UpdateAction.Install]: ButtonVariant.Primary,
};

/**
 * The installed version as a settings row with "check for updates", and the download once a newer
 * release exists. A waiting update turns the row's badge and message to the accent.
 */
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
  const { colors } = useTheme();
  const { message, button } = update;
  const waiting = button?.action === UpdateAction.Install;

  return (
    <ListGroup>
      <ListRow
        title={`${t('settings.version')} ${version ?? ''}`.trim()}
        subtitle={message?.text}
        subtitleColor={waiting ? 'primary' : message ? TONE_COLORS[message.tone] : 'muted'}
        subtitleLive
        subtitleAlert={message?.alert}
        leading={
          <IconBadge
            icon={waiting ? IconName.ArrowDown : IconName.Phone}
            color={waiting ? colors.primary : colors.muted}
            solid={waiting}
            onColor={colors.onPrimary}
          />
        }
        below={
          button ? (
            <View style={{ paddingTop: 4, paddingBottom: 10 }}>
              <Button
                label={button.label}
                onPress={() => onAction(button.action)}
                variant={ACTION_VARIANTS[button.action]}
                loading={button.loading}
                height={46}
              />
            </View>
          ) : null
        }
      />
    </ListGroup>
  );
}
