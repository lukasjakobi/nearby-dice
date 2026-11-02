import type { TFunction } from '@/i18n';
import { StatusTone } from '@/ui';

export enum UpdateStatus {
  Idle = 'idle',
  Checking = 'checking',
  UpToDate = 'upToDate',
  Available = 'available',
  Downloading = 'downloading',
  Installing = 'installing',
  CheckFailed = 'checkFailed',
  DownloadFailed = 'downloadFailed',
}

/** What the update card can do next. */
export enum UpdateAction {
  Check = 'check',
  Install = 'install',
}

export type UpdateState =
  | { status: UpdateStatus.Idle | UpdateStatus.Checking | UpdateStatus.UpToDate }
  | { status: UpdateStatus.CheckFailed }
  | { status: UpdateStatus.Available | UpdateStatus.Installing; version: string }
  | { status: UpdateStatus.DownloadFailed; version: string }
  | { status: UpdateStatus.Downloading; version: string; percent: number };

export type UpdateView = {
  /** One line under the version: progress, result or error. */
  message: { text: string; tone: StatusTone; alert: boolean } | null;
  button: { label: string; action: UpdateAction; loading: boolean } | null;
};

/** The update card's message and button for the current check or download. */
export function buildUpdateView(t: TFunction, state: UpdateState): UpdateView {
  const button = (action: UpdateAction, label: string, loading = false) => ({
    label,
    action,
    loading,
  });
  const check = button(UpdateAction.Check, t('settings.update.check'));
  const install = button(UpdateAction.Install, t('settings.update.install'));
  const info = (text: string, tone = StatusTone.Neutral) => ({ text, tone, alert: false });
  const error = (text: string) => ({ text, tone: StatusTone.Danger, alert: true });

  switch (state.status) {
    case UpdateStatus.Idle:
      return { message: null, button: check };
    case UpdateStatus.Checking:
      return { message: info(t('settings.update.checking')), button: { ...check, loading: true } };
    case UpdateStatus.UpToDate:
      return { message: info(t('settings.update.upToDate'), StatusTone.Success), button: check };
    case UpdateStatus.CheckFailed:
      return {
        message: error(t('settings.update.checkFailed')),
        button: button(UpdateAction.Check, t('settings.update.retry')),
      };
    case UpdateStatus.Available:
    case UpdateStatus.Installing:
      return {
        message: info(t('settings.update.available', { version: state.version })),
        button: { ...install, loading: state.status === UpdateStatus.Installing },
      };
    case UpdateStatus.Downloading:
      return {
        message: info(t('settings.update.downloading', { percent: state.percent })),
        button: { ...install, loading: true },
      };
    case UpdateStatus.DownloadFailed:
      return {
        message: error(t('settings.update.downloadFailed')),
        button: button(UpdateAction.Install, t('settings.update.retry')),
      };
  }
}
