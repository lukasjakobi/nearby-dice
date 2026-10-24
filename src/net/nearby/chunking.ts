/** Nearby BYTES payloads are limited to 32 KB. Large serialized states travel in chunks. */
export const CHUNK_SIZE = 8000;
const MARK = '~';
const MAX_MESSAGE_CHARS = 512_000;
const MAX_CHUNKS = Math.ceil(MAX_MESSAGE_CHARS / CHUNK_SIZE);
const MAX_FRAME_CHARS = CHUNK_SIZE + 96;
const MAX_PENDING_PER_PEER = 4;
const MAX_PENDING_GLOBAL = 16;
const MAX_PENDING_CHARS_PER_PEER = MAX_MESSAGE_CHARS;
const MAX_PENDING_CHARS_GLOBAL = 1_048_576;
const PARTIAL_TTL_MS = 30_000;

export function splitIntoChunks(data: string, messageId: string, size = CHUNK_SIZE): string[] {
  if (
    typeof data !== 'string' ||
    data.length > MAX_MESSAGE_CHARS ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > CHUNK_SIZE ||
    !validId(messageId)
  )
    throw new RangeError('Invalid or oversized Nearby message');

  if (data.length <= size && !data.startsWith(MARK)) return [data];
  const count = Math.ceil(data.length / size);
  if (count < 1 || count > MAX_CHUNKS) throw new RangeError('Too many Nearby chunks');

  return Array.from(
    { length: count },
    (_, index) =>
      `${MARK}${messageId}:${index}:${count}:${data.slice(index * size, (index + 1) * size)}`,
  );
}

type PendingMessage = {
  sender: string;
  parts: (string | undefined)[];
  chars: number;
  updatedAt: number;
};

/** Reassembles bounded, short-lived chunks per sender. Invalid frames are dropped. */
export class ChunkAssembler {
  private pending = new Map<string, PendingMessage>();
  private pendingChars = 0;

  get pendingCount(): number {
    return this.pending.size;
  }
  get maxPendingMessages(): number {
    return MAX_PENDING_GLOBAL;
  }

  accept(sender: string, frame: string): string | null {
    this.expire();
    if (typeof sender !== 'string' || sender.length === 0 || typeof frame !== 'string') return null;
    if (!frame.startsWith(MARK)) return frame.length <= MAX_MESSAGE_CHARS ? frame : null;
    if (frame.length > MAX_FRAME_CHARS) return null;

    const first = frame.indexOf(':', 1);
    const second = first < 0 ? -1 : frame.indexOf(':', first + 1);
    const third = second < 0 ? -1 : frame.indexOf(':', second + 1);
    if (first < 2 || second < 0 || third < 0) return null;
    const id = frame.slice(1, first);
    const rawIndex = frame.slice(first + 1, second);
    const rawCount = frame.slice(second + 1, third);
    const part = frame.slice(third + 1);
    if (
      !validId(id) ||
      !isDecimal(rawIndex) ||
      !isDecimal(rawCount) ||
      part.length === 0 ||
      part.length > CHUNK_SIZE
    )
      return null;
    const index = Number(rawIndex);
    const count = Number(rawCount);
    if (
      !Number.isSafeInteger(index) ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > MAX_CHUNKS ||
      index < 0 ||
      index >= count
    )
      return null;

    const key = JSON.stringify([sender, id]);
    let message = this.pending.get(key);
    if (message && message.parts.length !== count) {
      this.remove(key);

      return null;
    }

    if (!message) {
      if (this.countFor(sender) >= MAX_PENDING_PER_PEER || this.pending.size >= MAX_PENDING_GLOBAL)
        return null;
      message = {
        sender,
        parts: Array.from({ length: count }, () => undefined),
        chars: 0,
        updatedAt: Date.now(),
      };
      this.pending.set(key, message);
    }

    const oldPart = message.parts[index];
    if (oldPart !== undefined) {
      if (oldPart !== part) this.remove(key);

      return null;
    }

    const nextPeerChars = this.charsFor(sender) + part.length;
    if (
      message.chars + part.length > MAX_MESSAGE_CHARS ||
      nextPeerChars > MAX_PENDING_CHARS_PER_PEER ||
      this.pendingChars + part.length > MAX_PENDING_CHARS_GLOBAL
    ) {
      this.remove(key);

      return null;
    }

    message.parts[index] = part;
    message.chars += part.length;
    message.updatedAt = Date.now();
    this.pendingChars += part.length;
    if (message.parts.some((chunk) => chunk === undefined)) return null;
    const result = (message.parts as string[]).join('');
    this.remove(key);

    return result.length <= MAX_MESSAGE_CHARS ? result : null;
  }

  forget(sender: string): void {
    for (const [key, value] of this.pending) if (value.sender === sender) this.remove(key);
  }

  private expire(): void {
    const cutoff = Date.now() - PARTIAL_TTL_MS;
    for (const [key, value] of this.pending) if (value.updatedAt < cutoff) this.remove(key);
  }

  private countFor(sender: string): number {
    let count = 0;
    for (const value of this.pending.values()) if (value.sender === sender) count++;

    return count;
  }

  private charsFor(sender: string): number {
    let count = 0;
    for (const value of this.pending.values()) if (value.sender === sender) count += value.chars;

    return count;
  }

  private remove(key: string): void {
    const message = this.pending.get(key);
    if (message) this.pendingChars -= message.chars;
    this.pending.delete(key);
  }
}

function isDecimal(value: string): boolean {
  return /^(0|[1-9]\d{0,8})$/.test(value);
}

function validId(value: string): boolean {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
}
