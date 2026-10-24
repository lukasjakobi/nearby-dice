import { screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { renderScreen } from '@/test/render';

import { Dialog } from '../Dialog';

const action = { label: 'Abbrechen', onPress: () => {} };

afterEach(() => jest.restoreAllMocks());

test.each([
  ['fades in', false, 'fade'],
  ['appears at once with reduce motion', true, 'none'],
])('the dialog %s', async (_, reduceMotion, animation) => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(reduceMotion);
  await renderScreen(<Dialog visible title="Titel" body="Text" confirm={action} cancel={action} />);

  let modal = screen.getByText('Titel').parent;
  while (modal && modal.type !== 'Modal') modal = modal.parent;
  expect(modal?.props.animationType).toBe(animation);
});
