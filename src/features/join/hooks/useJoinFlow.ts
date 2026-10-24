import { useCallback, useEffect, useRef, useState } from 'react';

import { initialOf } from '@/domain';
import { AbortedError } from '@/lib';
import { getTransport, isFull, normalizeRoundCode, ROUND_CODE_LENGTH } from '@/net';
import {
  getRoundScanner,
  GuestSession,
  JoinError,
  JoinFailedError,
  JoinStep,
  setActiveSession,
  useScanState,
} from '@/session';
import { useProfileStore } from '@/store';
import { PLAYER_COLOR_HEX } from '@/ui';
import { navigate, Route, usePermissionGate } from '@/shared';

export enum JoinPhase {
  Checking = 'checking',
  Access = 'access',
  Entry = 'entry',
  Working = 'working',
  Success = 'success',
  Error = 'error',
}

export type NearbyRoundView = {
  endpointId: string;
  code: string;
  roundName: string;
  initial: string;
  color: string;
  players: number;
  maxPlayers: number;
  full: boolean;
};

const SUCCESS_PAUSE_MS = 1200;

const CAN_RETRY: Record<JoinError, boolean> = {
  [JoinError.NotFound]: true,
  [JoinError.Full]: true,
  [JoinError.Removed]: false,
  [JoinError.Started]: false,
  [JoinError.BluetoothOff]: true,
  [JoinError.LocationOff]: true,
  [JoinError.Denied]: false,
};

const SCANNING_PHASES = new Set([JoinPhase.Entry, JoinPhase.Working]);

export function useJoinFlow() {
  const permission = usePermissionGate();
  const { ensureReady } = permission;
  const profile = useProfileStore((s) => s.profile);
  const deviceId = useProfileStore((s) => s.deviceId);
  const scanner = getRoundScanner();
  const scan = useScanState(scanner);
  const [phase, setPhase] = useState(JoinPhase.Checking);
  const [code, setCode] = useState('');
  const [step, setStep] = useState(JoinStep.Search);
  const [error, setError] = useState(JoinError.NotFound);
  const [refreshing, setRefreshing] = useState(false);
  const refreshPending = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const joining = useRef(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSession = useRef<GuestSession | null>(null);

  /** Gives up the join in flight, or the joined session waiting out the success pause. */
  const abandon = useCallback(() => {
    abort.current?.abort();
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = null;
    pendingSession.current?.dispose();
    pendingSession.current = null;
  }, []);

  const checkReadiness = useCallback(async () => {
    setPhase(JoinPhase.Checking);
    const ready = await ensureReady();
    if (mounted.current) setPhase(ready ? JoinPhase.Entry : JoinPhase.Access);
  }, [ensureReady]);

  useEffect(() => {
    mounted.current = true;
    void ensureReady().then((ready) => {
      if (mounted.current) setPhase(ready ? JoinPhase.Entry : JoinPhase.Access);
    });

    return () => {
      mounted.current = false;
      abandon();
    };
  }, [abandon, ensureReady]);

  // Discovery runs while the code entry (or a join attempt) is on screen.
  const scanning = SCANNING_PHASES.has(phase);
  useEffect(() => (scanning ? scanner.acquire() : undefined), [scanning, scanner]);

  const refresh = async () => {
    if (phase !== JoinPhase.Entry || scan.scanning || refreshPending.current || joining.current)
      return;
    refreshPending.current = true;
    setRefreshing(true);
    try {
      const ready = await ensureReady();
      if (!mounted.current || joining.current) return;
      if (ready) scanner.refresh();
      else setPhase(JoinPhase.Access);
    } finally {
      refreshPending.current = false;
      if (mounted.current) setRefreshing(false);
    }
  };

  const join = async (joinCode: string) => {
    if (!profile || joining.current) return;
    joining.current = true;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setCode(joinCode);
    setStep(JoinStep.Search);
    setPhase(JoinPhase.Checking);
    try {
      const ready = await ensureReady();
      if (!mounted.current || controller.signal.aborted) return;
      if (!ready) {
        setPhase(JoinPhase.Access);

        return;
      }

      setPhase(JoinPhase.Working);
      const session = await GuestSession.join({
        transport: getTransport(),
        scanner,
        deviceId,
        profile,
        code: joinCode,
        onStep: setStep,
        signal: controller.signal,
      });
      if (!mounted.current || controller.signal.aborted) {
        session.dispose();

        return;
      }

      pendingSession.current = session;
      setPhase(JoinPhase.Success);
      successTimer.current = setTimeout(() => {
        pendingSession.current = null;
        setActiveSession(session);
        navigate.replace(Route.GuestLobby);
      }, SUCCESS_PAUSE_MS);
    } catch (e) {
      if (!mounted.current || controller.signal.aborted || e instanceof AbortedError) return;
      if (!(e instanceof JoinFailedError)) {
        console.error('Joining the lobby failed', e);
        setError(JoinError.NotFound);
        setPhase(JoinPhase.Error);

        return;
      }

      if (
        e.reason === JoinError.Denied ||
        e.reason === JoinError.BluetoothOff ||
        e.reason === JoinError.LocationOff
      ) {
        await checkReadiness();

        return;
      }

      setError(e.reason);
      setPhase(JoinPhase.Error);
    } finally {
      joining.current = false;
    }
  };

  return {
    phase,
    code,
    step,
    error,
    canRetry: CAN_RETRY[error],
    canJoin: code.length === ROUND_CODE_LENGTH,
    scanning: scan.scanning || refreshing,
    scanError: scan.error !== null,
    rounds: scan.rounds.map(({ endpointId, advertisement: ad }): NearbyRoundView => ({
      endpointId,
      code: ad.code,
      roundName: ad.roundName,
      initial: initialOf(ad.hostName),
      color: PLAYER_COLOR_HEX[ad.hostColor],
      players: ad.players,
      maxPlayers: ad.maxPlayers,
      full: isFull(ad),
    })),
    setCode: (input: string) => setCode(normalizeRoundCode(input)),
    permissionSheet: permission.sheet,
    recheck: () => void checkReadiness(),
    refresh: () => void refresh(),
    join: () => void join(code),
    joinRound: (round: NearbyRoundView) => {
      if (!round.full) void join(round.code);
    },
    cancel: () => {
      abort.current?.abort();
      setPhase(JoinPhase.Entry);
    },
    retry: () => void join(code),
    otherCode: () => {
      setCode('');
      setPhase(JoinPhase.Entry);
    },
    back: () => {
      permission.cancel();
      abandon();
      navigate.back();
    },
  };
}
