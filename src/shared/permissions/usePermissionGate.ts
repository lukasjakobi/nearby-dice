import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { getTransport, PermissionStatus, RadioState } from '@/net';
import type { Transport } from '@/net';

import type { PermissionSheetProps, PermissionSheetState } from './PermissionSheet';

type PendingGate = {
  promise: Promise<boolean>;
  resolve: (ready: boolean) => void;
  requested: boolean;
  busy: boolean;
  recheck: boolean;
};

/** One shared request per screen; callers resume only once permissions and radios are ready. */
export function usePermissionGate(transport?: Transport) {
  const pending = useRef<PendingGate | null>(null);
  const mounted = useRef(true);
  const [state, setState] = useState<PermissionSheetState | null>(null);
  const [busy, setBusy] = useState(false);
  const [settingsError, setSettingsError] = useState(false);

  const finish = useCallback((ready: boolean) => {
    const gate = pending.current;
    pending.current = null;
    if (mounted.current) {
      setState(null);
      setBusy(false);
      setSettingsError(false);
    }

    gate?.resolve(ready);
  }, []);

  const inspect = useCallback(
    async function check(gate: PendingGate, request = false): Promise<void> {
      if (pending.current !== gate) return;
      if (gate.busy) {
        gate.recheck = true;

        return;
      }

      gate.busy = true;
      setBusy(true);
      setSettingsError(false);
      try {
        const nearby = transport ?? getTransport();
        if (request) gate.requested = true;
        const permission = await (request ? nearby.requestPermission() : nearby.getPermission());
        if (pending.current !== gate) return;
        if (permission !== PermissionStatus.Granted) {
          setState(
            permission === PermissionStatus.Denied && !gate.requested
              ? { variant: 'primer' }
              : {
                  variant: 'blocked',
                  problem: permission === PermissionStatus.Unavailable ? 'unavailable' : undefined,
                },
          );

          return;
        }

        const radio = await nearby.getRadioState();
        if (pending.current !== gate) return;
        if (radio === RadioState.Ready) finish(true);
        else setState({ variant: 'radio', radio });
      } catch {
        if (pending.current === gate) setState({ variant: 'blocked', problem: 'check' });
      } finally {
        gate.busy = false;
        if (pending.current === gate) {
          setBusy(false);
          if (gate.recheck) {
            gate.recheck = false;
            void check(gate);
          }
        }
      }
    },
    [finish, transport],
  );

  const ensureReady = useCallback((): Promise<boolean> => {
    if (!mounted.current) return Promise.resolve(false);
    if (pending.current) return pending.current.promise;
    let resolve!: (ready: boolean) => void;
    const promise = new Promise<boolean>((done) => {
      resolve = done;
    });
    const gate: PendingGate = { promise, resolve, requested: false, busy: false, recheck: false };
    pending.current = gate;
    void inspect(gate);

    return promise;
  }, [inspect]);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && pending.current) void inspect(pending.current);
    });

    return () => {
      mounted.current = false;
      subscription.remove();
      finish(false);
    };
  }, [finish, inspect]);

  const act = async () => {
    const gate = pending.current;
    if (!gate || gate.busy || !state) return;
    if (state.variant === 'primer' || (state.variant === 'blocked' && state.problem)) {
      await inspect(gate, state.variant === 'primer');

      return;
    }

    gate.busy = true;
    gate.requested = true;
    setBusy(true);
    setSettingsError(false);
    try {
      if (Platform.OS === 'android' && state.variant === 'radio') {
        await Linking.sendIntent(
          state.radio === RadioState.LocationOff
            ? 'android.settings.LOCATION_SOURCE_SETTINGS'
            : 'android.settings.BLUETOOTH_SETTINGS',
        );
      } else await Linking.openSettings();
    } catch {
      if (pending.current === gate) setSettingsError(true);
    } finally {
      gate.busy = false;
      if (pending.current === gate) {
        setBusy(false);
        if (gate.recheck) {
          gate.recheck = false;
          void inspect(gate);
        }
      }
    }
  };

  /** Props for `<PermissionSheet>` while it should show. */
  const sheet: PermissionSheetProps | null = state
    ? {
        state,
        busy,
        settingsError,
        onAction: () => void act(),
        onClose: () => finish(false),
      }
    : null;

  return {
    ensureReady,
    cancel: useCallback(() => finish(false), [finish]),
    sheet,
  };
}
