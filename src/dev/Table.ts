import { PresetId } from '@/domain';
import type { Profile, Rng } from '@/domain';
import { i18n } from '@/i18n';
import { randomId, withTimeout } from '@/lib';
import { createBrowserTransport } from '@/net';
import { GuestSession, HostSession, RoundScanner } from '@/session';
import type { SessionController, SessionSnapshot } from '@/session';

import { BotPlayer } from './BotPlayer';
import type { BotOptions } from './BotPlayer';

/** Slow enough that a bot guest stays under the host's message cap (`MAX_MESSAGES_PER_WINDOW`). */
const BOT_THINK_MS = 120;
/** A scenario that takes longer is stuck. */
const SETUP_TIMEOUT_MS = 60_000;
/** Only dev code has it, so `npm run check:release-bundle` looks for it in release bundles. */
const CHANNEL_PREFIX = 'nearbydice-scenario-';

/**
 * The phones of one scenario. They all live in this page, on a channel of their own that other
 * tabs never hear. Bots play the other phones, and the one on screen too until the scenario has
 * the state it wants.
 */
export class Table {
  private readonly channel = CHANNEL_PREFIX + randomId(6);
  private readonly bots: BotPlayer[] = [];

  constructor(private readonly rng: Rng) {}

  host(profile: Profile, preset = PresetId.Classic): Promise<HostSession> {
    return HostSession.open({
      ...this.phone(),
      profile,
      roundName: i18n.t('hostSetup.roundNameDefault', { name: profile.name }),
      preset,
      rng: this.rng,
    });
  }

  join(code: string, profile: Profile, deviceId = randomId()): Promise<GuestSession> {
    return GuestSession.join({ ...this.phone(), deviceId, profile, code });
  }

  play(session: SessionController, options: BotOptions = {}): void {
    this.bots.push(new BotPlayer(session, { thinkMs: BOT_THINK_MS, rematch: null, ...options }));
  }

  /** Resolves once `session` is in the state, with every bot stopped right there. */
  stopWhen(
    session: SessionController,
    reached: (snapshot: SessionSnapshot) => boolean,
  ): Promise<void> {
    const stopped = new Promise<void>((resolve) => {
      const check = () => {
        if (!reached(session.getSnapshot())) return;
        unsubscribe();
        this.bots.forEach((bot) => bot.stop());
        resolve();
      };

      const unsubscribe = session.subscribe(check);
      check();
    });

    return withTimeout(stopped, SETUP_TIMEOUT_MS);
  }

  private phone() {
    const transport = createBrowserTransport(this.channel);

    return { transport, scanner: new RoundScanner(transport) };
  }
}
