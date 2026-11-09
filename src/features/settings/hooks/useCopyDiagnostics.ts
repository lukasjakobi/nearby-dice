import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { getTransport } from '@/net';
import { useActiveSession } from '@/session';
import { useErrorLogStore } from '@/store';
import { useToast } from '@/ui';

import { buildDiagnostics } from '../view';

/** Settles to null instead of failing, so one unreadable value cannot block the copy. */
const orNull = <T>(promise: Promise<T>): Promise<T | null> => promise.catch(() => null);

/** Copies app, session and transport state plus the recent errors, for a bug report. */
export function useCopyDiagnostics(appVersion: string | undefined) {
  const { t } = useTranslation();
  const toast = useToast();
  const session = useActiveSession();

  return async () => {
    const transport = getTransport();
    const [permission, radio] = await Promise.all([
      orNull(transport.getPermission()),
      orNull(transport.getRadioState()),
    ]);
    const text = buildDiagnostics({
      appVersion,
      os: `${Platform.OS} ${Platform.Version}`,
      session: session?.getSnapshot() ?? null,
      permission,
      radio,
      errors: useErrorLogStore.getState().errors,
    });
    await Clipboard.setStringAsync(text);
    toast.show(t('settings.diagnosticsCopied'));
  };
}
