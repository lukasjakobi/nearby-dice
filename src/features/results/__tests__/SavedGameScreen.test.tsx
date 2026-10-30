import { fireEvent, screen } from '@testing-library/react-native';

import { ranking } from '@/domain';
import { useStatsStore } from '@/store/stats';
import { LUKAS, ANTONIA, savedGame } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

import { SavedGameScreen } from '../SavedGameScreen';

// The mocked module itself, so a spy reaches the screen's own import.
const expoRouter = jest.requireMock<typeof import('expo-router')>('expo-router');
const SAVED = savedGame([LUKAS, ANTONIA], ANTONIA);

function openSavedGame(id: string) {
  jest.spyOn(expoRouter, 'useLocalSearchParams').mockReturnValue({ id });

  return renderScreen(<SavedGameScreen />);
}

beforeEach(() => {
  useStatsStore.getState().record(SAVED);
});

afterEach(() => jest.restoreAllMocks());

test('a saved game shows the ranking, every field and the history', async () => {
  await openSavedGame('session-1');

  expect(screen.getByText('Klassisch')).toBeTruthy();
  const top = ranking(SAVED.game)[0]!;
  expect(screen.getAllByText(String(top.total)).length).toBeGreaterThan(0);

  expect(screen.getByText('Endstand')).toBeTruthy();
  expect(screen.getByText('Alle Felder im Vergleich')).toBeTruthy();
  expect(screen.getByText('Feld')).toBeTruthy();

  await fireEvent.press(screen.getByText('Verlauf'));
  expect(screen.getAllByText(/Runde 13/).length).toBeGreaterThan(0);
});

test('back leaves the saved game', async () => {
  await openSavedGame('session-1');

  await fireEvent.press(screen.getByLabelText('Zurück'));

  expect(expoRouter.router.back).toHaveBeenCalled();
});

test('a game that is no longer saved is not shown', async () => {
  await openSavedGame('unknown');

  expect(screen.queryByText('Klassisch')).toBeNull();
});
