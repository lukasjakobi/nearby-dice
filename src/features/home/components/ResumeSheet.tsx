import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

import {
  Button,
  ButtonVariant,
  Icon,
  IconName,
  Sheet,
  Spinner,
  Text,
  TextVariant,
  useTheme,
} from '@/ui';

import { ResumeState } from '../hooks';

type ResumeSheetProps = {
  state: ResumeState;
  attempt: number;
  host: string;
  round: number;
  onCancel: () => void;
  onRetry: () => void;
  onEnter: () => void;
};

/** The search overlay after "Fortsetzen": searching, success or failure. */
export function ResumeSheet({
  state,
  attempt,
  host,
  round,
  onCancel,
  onRetry,
  onEnter,
}: ResumeSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const content: Record<Exclude<ResumeState, ResumeState.Idle>, ReactNode> = {
    [ResumeState.Searching]: (
      <>
        <Spinner
          color={colors.primary}
          size={44}
          strokeWidth={2.2}
          label={t('home.resume.searching', { host })}
        />
        <Text variant={TextVariant.DialogTitle} align="center">
          {t('home.resume.searching', { host })}
        </Text>
        <Text
          variant={TextVariant.Body}
          size={14}
          color="muted"
          align="center"
          accessibilityLiveRegion="polite"
        >
          {t('home.resume.attempt', { n: attempt, host })}
        </Text>
        <Button
          label={t('common.cancel')}
          onPress={onCancel}
          variant={ButtonVariant.Secondary}
          style={{ alignSelf: 'stretch' }}
        />
      </>
    ),
    [ResumeState.Success]: (
      <>
        <Icon name={IconName.CheckCircle} color={colors.ok} size={48} />
        <Text variant={TextVariant.DialogTitle}>{t('home.resume.successTitle')}</Text>
        <Text variant={TextVariant.Body} size={14} color="muted" align="center">
          {t('home.resume.successBody', { host, round })}
        </Text>
        <Button
          label={t('home.resume.successAction')}
          onPress={onEnter}
          style={{ alignSelf: 'stretch' }}
        />
      </>
    ),
    [ResumeState.Failed]: (
      <>
        <Icon name={IconName.AlertCircle} color={colors.danger} size={48} />
        <Text variant={TextVariant.DialogTitle}>{t('home.resume.failTitle')}</Text>
        <Text variant={TextVariant.Body} size={14} color="muted" align="center">
          {t('home.resume.failBody', { host })}
        </Text>
        <Button label={t('home.resume.retry')} onPress={onRetry} style={{ alignSelf: 'stretch' }} />
        <Button
          label={t('home.resume.later')}
          onPress={onCancel}
          variant={ButtonVariant.Secondary}
          style={{ alignSelf: 'stretch' }}
        />
      </>
    ),
  };

  return (
    <Sheet visible={state !== ResumeState.Idle} onClose={onCancel} centered>
      {state !== ResumeState.Idle ? content[state] : null}
    </Sheet>
  );
}
