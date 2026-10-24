import { router } from 'expo-router';
import type { Href } from 'expo-router';

/** Every screen's path. Session screens live in the `(session)` route group. */
export enum Route {
  Home = '/',
  Onboarding = '/onboarding',
  Profile = '/profile',
  Settings = '/settings',
  HostSetup = '/host-setup',
  Join = '/join',
  Training = '/training',
  HostLobby = '/host-lobby',
  GuestLobby = '/guest-lobby',
  Game = '/game',
  Results = '/results',
  SavedGame = '/saved-game',
}

export enum ProfileMode {
  Create = 'create',
  Edit = 'edit',
}

type Params = Record<string, string>;

export const href = (route: Route, params?: Params) =>
  (params ? { pathname: route, params } : route) as unknown as Href;

/** The only places that talk to the router; screens pass a `Route`. */
export const navigate = {
  push: (route: Route, params?: Params) => router.push(href(route, params)),
  replace: (route: Route, params?: Params) => router.replace(href(route, params)),
  back: () => router.back(),
};

/** Back to Start, dropping every screen above it. */
export function goHome(): void {
  if (router.canDismiss()) router.dismissAll();
  navigate.replace(Route.Home);
}
