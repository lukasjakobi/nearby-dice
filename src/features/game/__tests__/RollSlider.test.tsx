import { fireEvent, screen } from '@testing-library/react-native';

import { slide } from '@/test/gestures';
import { renderScreen } from '@/test/render';

import { RollSlider } from '../components/RollSlider';

async function renderSlider() {
  const onRoll = jest.fn();
  await renderScreen(<RollSlider label="Würfeln" onRoll={onRoll} />);

  return { onRoll, slider: screen.getByRole('button', { name: 'Würfeln' }) };
}

test('sliding the knob to the far end rolls', async () => {
  const { onRoll, slider } = await renderSlider();
  await slide(slider);
  expect(onRoll).toHaveBeenCalledTimes(1);
});

test('a tap or a short slide does not roll', async () => {
  const { onRoll, slider } = await renderSlider();
  await fireEvent.press(slider);
  await slide(slider, 0);
  await slide(slider, 120);
  expect(onRoll).not.toHaveBeenCalled();
});

test('a slide the system takes over does not roll, however far it got', async () => {
  const { onRoll, slider } = await renderSlider();
  await fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 300, height: 44 } } });
  await fireEvent(slider, 'responderGrant', { nativeEvent: { pageX: 0 } });
  await fireEvent(slider, 'responderMove', { nativeEvent: { pageX: 300 } });
  await fireEvent(slider, 'responderTerminate', { nativeEvent: { pageX: 300 } });
  expect(onRoll).not.toHaveBeenCalled();
});

test('screen readers roll with the activate action', async () => {
  const { onRoll, slider } = await renderSlider();
  await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
  expect(onRoll).toHaveBeenCalledTimes(1);
});
