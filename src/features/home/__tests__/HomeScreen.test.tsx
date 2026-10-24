import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { PlayerColor } from '@/domain/player';
import { useProfileStore } from '@/store/profile';
import { useStatsStore } from '@/store/stats';
import { JONAS, LUKAS, ANTONIA, savedGame } from '@/test/fixtures';
import { renderScreen } from '@/test/render';

import { HomeScreen } from '../HomeScreen';

beforeEach(() => {
  useProfileStore.setState({
    profile: { name: 'Antonia', color: PlayerColor.Sky },
    onboardingDone: true,
  });
});

test('a saved game lists the opponents and opens when tapped', async () => {
  useStatsStore.getState().record(savedGame([LUKAS, ANTONIA, JONAS], ANTONIA));
  await renderScreen(<HomeScreen />);

  await fireEvent.press(screen.getByText(/Lukas/));

  expect(router.push).toHaveBeenCalledWith({
    pathname: '/saved-game',
    params: { id: 'session-1' },
  });
});

test('without saved games the empty hint is shown', async () => {
  await renderScreen(<HomeScreen />);

  expect(
    screen.getByText('Noch keine Runde gespielt. Deine ersten Ergebnisse erscheinen hier.'),
  ).toBeTruthy();
});
