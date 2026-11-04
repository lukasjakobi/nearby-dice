import { fireEvent, screen } from '@testing-library/react-native';

import { t } from '@/test/i18n';
import { renderScreen } from '@/test/render';

import { NearbyRounds } from '../components/NearbyRounds';

test('searching shows the radar and no way to refresh it by hand', async () => {
  await renderScreen(
    <NearbyRounds rounds={[]} onJoin={jest.fn()} onRetry={jest.fn()} error={false} />,
  );

  expect(screen.getByRole('progressbar', { name: t('join.scanning') })).toBeTruthy();
  expect(screen.root?.queryAll((node) => node.props.refreshControl != null)).toHaveLength(0);
  expect(screen.root?.queryAll((node) => node.props.accessibilityState?.busy)).toHaveLength(1);
  expect(screen.queryByText(t('join.retry'))).toBeNull();
});

test('a failed search replaces the radar with the error and a retry', async () => {
  const onRetry = jest.fn();
  await renderScreen(<NearbyRounds rounds={[]} onJoin={jest.fn()} onRetry={onRetry} error />);

  expect(screen.getByText(t('join.scanFailed'))).toBeTruthy();
  expect(screen.queryByRole('progressbar', { name: t('join.scanning') })).toBeNull();
  await fireEvent.press(screen.getByText(t('join.retry')));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
