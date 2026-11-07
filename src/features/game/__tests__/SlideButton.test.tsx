import { fireEvent, screen } from '@testing-library/react-native';

import { IconName } from '@/ui';
import { slide } from '@/test/gestures';
import { renderScreen } from '@/test/render';

import { SlideButton, SlideTone } from '../components/SlideButton';

async function renderSlide(busy = false) {
  const onCommit = jest.fn();
  await renderScreen(
    <SlideButton
      label="Würfeln"
      icon={IconName.Dice}
      tone={SlideTone.Roll}
      onCommit={onCommit}
      busy={busy}
    />,
  );

  return { onCommit, slider: screen.getByRole('button', { name: 'Würfeln' }) };
}

test('sliding the knob to the far end commits', async () => {
  const { onCommit, slider } = await renderSlide();
  await slide(slider);
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test('a tap or a short slide does not commit', async () => {
  const { onCommit, slider } = await renderSlide();
  await fireEvent.press(slider);
  await slide(slider, 0);
  await slide(slider, 120);
  expect(onCommit).not.toHaveBeenCalled();
});

test('a slide the system takes over does not commit, however far it got', async () => {
  const { onCommit, slider } = await renderSlide();
  await fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 300, height: 44 } } });
  await fireEvent(slider, 'responderGrant', { nativeEvent: { pageX: 0 } });
  await fireEvent(slider, 'responderMove', { nativeEvent: { pageX: 300 } });
  await fireEvent(slider, 'responderTerminate', { nativeEvent: { pageX: 300 } });
  expect(onCommit).not.toHaveBeenCalled();
});

test('screen readers commit with the activate action', async () => {
  const { onCommit, slider } = await renderSlide();
  await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
  expect(onCommit).toHaveBeenCalledTimes(1);
});

test('while busy it neither slides nor activates', async () => {
  const { onCommit, slider } = await renderSlide(true);
  await slide(slider);
  await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
  expect(onCommit).not.toHaveBeenCalled();
});
