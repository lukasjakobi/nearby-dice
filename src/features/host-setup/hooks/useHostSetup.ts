import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';

import { PresetId } from '@/domain';
import { getTransport } from '@/net';
import {
  getRoundScanner,
  HostError,
  HostOpenError,
  HostSession,
  setActiveSession,
} from '@/session';
import { navigate, Route, usePermissionGate, useProfileOrGuest } from '@/shared';

export enum OpenState {
  Idle = 'idle',
  Opening = 'opening',
  Failed = 'failed',
}

export function useHostSetup() {
  const { t } = useTranslation();
  const permission = usePermissionGate();
  const opening = useRef(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const profile = useProfileOrGuest();
  const [preset, setPreset] = useState(PresetId.Classic);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [openState, setOpenState] = useState(OpenState.Idle);
  const [error, setError] = useState<HostError | null>(null);

  const open = async () => {
    if (opening.current) return;

    opening.current = true;
    const controller = new AbortController();
    abort.current = controller;
    setOpenState(OpenState.Opening);
    setError(null);
    try {
      const ready = await permission.ensureReady();
      if (controller.signal.aborted) return;
      if (!ready) {
        setOpenState(OpenState.Idle);

        return;
      }

      const session = await HostSession.open({
        transport: getTransport(),
        scanner: getRoundScanner(),
        profile,
        // Older clients still read this field from the advertisement and snapshot.
        roundName: t('hostSetup.roundNameDefault', { name: profile.name }),
        preset,
      });
      // Left the setup while the lobby was opening: nobody will use this session.
      if (controller.signal.aborted) {
        session.dispose();

        return;
      }

      setActiveSession(session);
      navigate.replace(Route.HostLobby);
    } catch (e) {
      if (controller.signal.aborted) return;
      if (!(e instanceof HostOpenError)) console.error('Opening the lobby failed', e);
      setError(e instanceof HostOpenError ? e.reason : HostError.PermissionMissing);
      setOpenState(OpenState.Failed);
    } finally {
      opening.current = false;
    }
  };

  return {
    preset,
    choosePreset: (id: PresetId) => {
      setPreset(id);
      setOpenState(OpenState.Idle);
      setError(null);
    },
    rulesOpen,
    openRules: () => setRulesOpen(true),
    closeRules: () => setRulesOpen(false),
    openState,
    error,
    open: () => void open(),
    permissionSheet: permission.sheet,
    back: () => {
      permission.cancel();
      abort.current?.abort();
      navigate.back();
    },
  };
}
