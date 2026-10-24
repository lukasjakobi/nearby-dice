/**
 * The guest's way into a round, shared by first join, reconnect and resume:
 * find the code → connect (Nearby verifies the link) → HELLO → WELCOME or REJECT.
 */
import type { Profile } from '@/domain';
import { AbortedError, TimeoutError } from '@/lib';
import { PermissionStatus, RadioState, TransportEvent } from '@/net';
import type { Connection, PeerId, Transport } from '@/net';

import { MessageType, RejectReason, decode, encode } from './protocol';
import type { MessageOf } from './protocol';
import type { RoundScanner } from './RoundScanner';
import { TIMING } from './timing';
import { JoinError, JoinStep } from './types';

export class JoinFailedError extends Error {
  constructor(readonly reason: JoinError) {
    super(`Join failed: ${reason}`);
  }
}

const REJECTION_TO_ERROR: Record<RejectReason, JoinError> = {
  [RejectReason.Full]: JoinError.Full,
  [RejectReason.Removed]: JoinError.Removed,
  [RejectReason.Started]: JoinError.Started,
};

export type HandshakeOptions = {
  transport: Transport;
  scanner: RoundScanner;
  code: string;
  deviceId: string;
  profile: Profile;
  rejoinToken: string | null;
  /** Bounds the whole attempt, from the search to the host's answer. */
  timeout?: number;
  onStep?: (step: JoinStep) => void;
  signal?: AbortSignal;
};

export type HandshakeResult = { peerId: PeerId; welcome: MessageOf<MessageType.Welcome> };

export async function checkRadio(transport: Transport): Promise<void> {
  let permission = await transport.getPermission();
  if (permission === PermissionStatus.Denied) permission = await transport.requestPermission();
  if (permission !== PermissionStatus.Granted) throw new JoinFailedError(JoinError.Denied);
  const radio = await transport.getRadioState();
  if (radio === RadioState.BluetoothOff) {
    throw new JoinFailedError(JoinError.BluetoothOff);
  }

  if (radio === RadioState.LocationOff) {
    throw new JoinFailedError(JoinError.LocationOff);
  }
}

export async function handshake(options: HandshakeOptions): Promise<HandshakeResult> {
  const { signal } = options;
  if (signal?.aborted) throw new AbortedError();
  // One deadline covers every stage; cancelling the caller's signal ends the attempt too.
  const timeout = options.timeout ?? TIMING.joinTimeout;
  const attempt = new AbortController();
  const end = () => attempt.abort();
  const deadline = setTimeout(end, timeout);
  signal?.addEventListener('abort', end, { once: true });
  // Discovery stays on for the whole handshake: on iOS, connecting goes through the discoverer.
  const release = options.scanner.acquire();
  try {
    return await connectAndGreet(options, attempt.signal, timeout);
  } catch (error) {
    if (signal?.aborted) throw new AbortedError();
    if (attempt.signal.aborted || error instanceof TimeoutError) {
      throw new JoinFailedError(JoinError.NotFound);
    }

    throw error;
  } finally {
    clearTimeout(deadline);
    signal?.removeEventListener('abort', end);
    release();
  }
}

async function connectAndGreet(
  options: HandshakeOptions,
  signal: AbortSignal,
  timeout: number,
): Promise<HandshakeResult> {
  const { transport, scanner, code, onStep } = options;

  onStep?.(JoinStep.Search);
  const endpointId = await scanner.waitFor(code, timeout, signal);

  onStep?.(JoinStep.Secure);
  let connection: Connection;
  try {
    connection = await transport.connect(endpointId, signal);
  } catch (error) {
    if (error instanceof AbortedError) throw error;
    throw new JoinFailedError(JoinError.NotFound);
  }

  // From here on the link belongs to this attempt, so every failure closes it.
  try {
    onStep?.(JoinStep.Join);
    const message = await greet(options, connection, signal);
    if (message.type === MessageType.Reject) {
      throw new JoinFailedError(REJECTION_TO_ERROR[message.reason]);
    }

    return { peerId: connection.peerId, welcome: message };
  } catch (error) {
    await transport.disconnect(connection.peerId);
    throw error;
  }
}

type Reply = MessageOf<MessageType.Welcome> | MessageOf<MessageType.Reject>;

/** Sends HELLO and waits for the host's answer. */
async function greet(
  options: HandshakeOptions,
  { peerId, authToken }: Connection,
  signal: AbortSignal,
): Promise<Reply> {
  const { transport } = options;
  const reply = listenForReply(transport, peerId);
  try {
    const hello = encode({
      type: MessageType.Hello,
      deviceId: options.deviceId,
      profile: options.profile,
      authToken,
      rejoinToken: options.rejoinToken,
    });
    await abortable(
      transport.send(peerId, hello).catch(() => {
        throw new JoinFailedError(JoinError.NotFound);
      }),
      signal,
    );

    return await abortable(reply.promise, signal);
  } finally {
    reply.cancel();
  }
}

function listenForReply(transport: Transport, peerId: PeerId) {
  let cleanup = () => {};

  const promise = new Promise<Reply>((resolve, reject) => {
    const offData = transport.on(TransportEvent.Data, (event) => {
      if (event.peerId !== peerId) return;
      const message = decode(event.data);
      if (message?.type === MessageType.Welcome || message?.type === MessageType.Reject) {
        cleanup();
        resolve(message);
      }
    });
    const offGone = transport.on(TransportEvent.PeerDisconnected, (event) => {
      if (event.peerId !== peerId) return;
      cleanup();
      reject(new JoinFailedError(JoinError.NotFound));
    });
    cleanup = () => {
      offData();
      offGone();
    };
  });

  return { promise, cancel: () => cleanup() };
}

/** Settles like `promise`, or rejects with `AbortedError` as soon as `signal` fires. */
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new AbortedError());
    if (signal.aborted) return onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    void promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}
