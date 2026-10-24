import { render, waitFor } from '@testing-library/react-native';

import { Font, fontFamily, setSystemFontFallback } from '@/ui/theme/typography';

import { AppShell } from '../AppShell';

const mockHideAsync = jest.fn(() => Promise.resolve());

jest.mock('expo-font', () => ({ useFonts: () => [false, new Error('font load failed')] }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: () => mockHideAsync(),
}));
jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('@/store', () => ({
  ...jest.requireActual<typeof import('@/store')>('@/store'),
  useStoresHydrated: () => true,
}));

test('font loading errors use system fonts, render the app, and hide the native splash', async () => {
  setSystemFontFallback(false);

  await render(<AppShell />);

  expect(fontFamily(Font.Body, 400)).not.toBe('WorkSans_400Regular');
  await waitFor(() => expect(mockHideAsync).toHaveBeenCalled());
});
