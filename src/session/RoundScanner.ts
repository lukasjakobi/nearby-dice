import { AbortedError, Store, TimeoutError } from '@/lib';
import type { Unsubscribe } from '@/lib';
import type { Advertisement, EndpointId, Transport } from '@/net';
import { TransportEvent } from '@/net';

import { TIMING } from './timing';

export type NearbyRound = { endpointId: EndpointId; advertisement: Advertisement };

export type ScanState = {
  rounds: NearbyRound[];
  /** True during the initial scan window, while nearby-round skeletons are shown. */
  scanning: boolean;
  error: Error | null;
};

/**
 * Keeps the list of rounds advertised nearby. Several users (the join screen, a
 * join attempt, the host's collision check) can hold it open at once.
 */
export class RoundScanner {
  readonly state = new Store<ScanState>({ rounds: [], scanning: false, error: null });
  private users = 0;
  private unsubscribers: Unsubscribe[] = [];
  private scanWindow: ReturnType<typeof setTimeout> | null = null;
  private discoveryTask: Promise<void> = Promise.resolve();
  private generation = 0;

  constructor(private transport: Transport) {}

  /** Starts discovery if needed; call the returned function when done. */
  acquire(): () => void {
    if (this.users++ === 0) this.start();
    let released = false;

    return () => {
      if (released) return;
      released = true;
      if (--this.users === 0) this.stop();
    };
  }

  /** Clears stale rounds and restarts discovery without releasing existing users. */
  refresh(): void {
    if (this.users === 0 || this.state.get().scanning) return;
    this.stop();
    this.start();
  }

  /** Waits until a round with `code` is advertised. Rejects with `TimeoutError` or `AbortedError`. */
  waitFor(code: string, timeoutMs: number, signal?: AbortSignal): Promise<EndpointId> {
    const release = this.acquire();

    return new Promise<EndpointId>((resolve, reject) => {
      const check = () => {
        const error = this.state.get().error;
        if (error) {
          finish(() => reject(error));

          return;
        }

        const match = this.state.get().rounds.find((r) => r.advertisement.code === code);
        if (match) finish(() => resolve(match.endpointId));
      };

      const timer = setTimeout(() => finish(() => reject(new TimeoutError())), timeoutMs);
      const onAbort = () => finish(() => reject(new AbortedError()));
      const unsubscribe = this.state.subscribe(check);
      const finish = (settle: () => void) => {
        clearTimeout(timer);
        unsubscribe();
        signal?.removeEventListener('abort', onAbort);
        release();
        settle();
      };

      signal?.addEventListener('abort', onAbort, { once: true });
      check();
    });
  }

  /** Codes currently advertised nearby (the host avoids them). */
  async collectCodes(durationMs: number): Promise<Set<string>> {
    const release = this.acquire();
    try {
      await new Promise<void>((resolve, reject) => {
        const finish = (error?: Error) => {
          clearTimeout(timer);
          unsubscribe();
          if (error) reject(error);
          else resolve();
        };

        const timer = setTimeout(() => finish(), durationMs);
        const check = () => {
          const error = this.state.get().error;
          if (error) finish(error);
        };

        const unsubscribe = this.state.subscribe(check);
        check();
      });

      return new Set(this.state.get().rounds.map((r) => r.advertisement.code));
    } finally {
      release();
    }
  }

  private start(): void {
    const generation = ++this.generation;
    this.state.set({ rounds: [], scanning: true, error: null });
    this.unsubscribers = [
      this.transport.on(TransportEvent.EndpointFound, ({ endpointId, advertisement }) =>
        this.state.update((s) => ({
          ...s,
          rounds: [
            ...s.rounds.filter((r) => r.endpointId !== endpointId),
            { endpointId, advertisement },
          ],
        })),
      ),
      this.transport.on(TransportEvent.EndpointLost, ({ endpointId }) =>
        this.state.update((s) => ({
          ...s,
          rounds: s.rounds.filter((r) => r.endpointId !== endpointId),
        })),
      ),
    ];
    this.scanWindow = setTimeout(
      () => this.state.update((s) => ({ ...s, scanning: false })),
      TIMING.scanWindow,
    );
    this.queueDiscovery(() => this.transport.startDiscovery(), generation);
  }

  private stop(): void {
    const generation = ++this.generation;
    this.clearListeners();
    this.state.set({ rounds: [], scanning: false, error: null });
    this.queueDiscovery(() => this.transport.stopDiscovery(), generation);
  }

  private clearListeners(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    if (this.scanWindow) clearTimeout(this.scanWindow);
    this.scanWindow = null;
  }

  /** Native discovery must finish stopping before it can start again. */
  private queueDiscovery(operation: () => Promise<void>, generation: number): void {
    this.discoveryTask = this.discoveryTask.then(operation).catch((error: unknown) => {
      if (generation !== this.generation) return;
      this.clearListeners();
      this.state.set({
        rounds: [],
        scanning: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    });
  }
}
