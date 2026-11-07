import { fireEvent } from '@testing-library/react-native';

type Element = Parameters<typeof fireEvent>[0];

const SLIDER_WIDTH = 300;

/** Slides the roll slider's knob `distance` points to the right and lets go. */
export async function slide(slider: Element, distance = SLIDER_WIDTH): Promise<void> {
  await fireEvent(slider, 'layout', {
    nativeEvent: { layout: { width: SLIDER_WIDTH, height: 44 } },
  });
  await fireEvent(slider, 'responderGrant', { nativeEvent: { pageX: 0 } });
  await fireEvent(slider, 'responderMove', { nativeEvent: { pageX: distance } });
  await fireEvent(slider, 'responderRelease', { nativeEvent: { pageX: distance } });
}
