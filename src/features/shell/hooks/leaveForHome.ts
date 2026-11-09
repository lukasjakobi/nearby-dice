import { setActiveSession } from '@/session';
import { goHome } from '@/shared';

/** The recovery screen's way out: leave any session, as the other home buttons do, then Start. */
export function leaveForHome(): void {
  setActiveSession(null);
  goHome();
}
