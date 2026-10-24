import { fireEvent, screen } from '@testing-library/react-native';

import { t } from '@/test/i18n';
import { renderScreen } from '@/test/render';

import { NearbyRounds } from '../components/NearbyRounds';

test('searching shows the small title spinner and skeletons with a disabled refresh button', async () => {
  await renderScreen(
    <NearbyRounds rounds={[]} scanning onJoin={jest.fn()} onRefresh={jest.fn()} error={false} />,
  );

  expect(screen.getByRole('progressbar', { name: t('join.scanning') })).toBeTruthy();
  expect(screen.root?.queryAll((node) => node.props.refreshControl != null)).toHaveLength(0);
  expect(screen.queryByText(t('join.nearbyEmpty'))).toBeNull();
  expect(screen.root?.queryAll((node) => node.props.accessibilityState?.busy)).toHaveLength(1);
  expect(screen.getByLabelText(t('join.refresh'))).toBeDisabled();
});

test('an empty search offers a manual refresh', async () => {
  const onRefresh = jest.fn();
  await renderScreen(
    <NearbyRounds
      rounds={[]}
      scanning={false}
      onJoin={jest.fn()}
      onRefresh={onRefresh}
      error={false}
    />,
  );

  expect(screen.getByText(t('join.nearbyEmpty'))).toBeTruthy();
  expect(screen.queryByLabelText(t('join.scanning'))).toBeNull();
  await fireEvent.press(screen.getByLabelText(t('join.refresh')));
  expect(onRefresh).toHaveBeenCalledTimes(1);
});
