import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// The native module is a no-op stub under Jest; Node supplies the secure random source.
jest.mock('expo-crypto', () => {
  const { webcrypto } = jest.requireActual<typeof import('crypto')>('crypto');

  return {
    __esModule: true,
    ...jest.requireActual<typeof import('expo-crypto')>('expo-crypto'),
    getRandomValues: <T extends Uint8Array>(array: T) => {
      // Node’s Web Crypto types accept ArrayBuffer-backed views only. Fill a temporary
      // view, then copy into the caller’s array (which may use SharedArrayBuffer).
      array.set(webcrypto.getRandomValues(new Uint8Array(array.length)));

      return array;
    },
  };
});

// Screens only use focus effects, params and the imperative router.
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');

  return {
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canDismiss: () => false,
      dismissAll: jest.fn(),
    },
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
    useLocalSearchParams: () => ({}),
    usePathname: () => '/',
    Redirect: () => null,
    Stack: () => null,
  };
});

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    playing: false,
  })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

// Tests assert the German copy.
jest.mock('expo-localization', () => {
  const locales = [{ languageCode: 'de', languageTag: 'de-DE' }];

  return { getLocales: () => locales, useLocales: () => locales };
});

const { i18n, Locale } = jest.requireActual<typeof import('@/i18n')>('@/i18n');
void i18n.changeLanguage(Locale.German);
