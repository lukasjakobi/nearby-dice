import { SvgXml } from 'react-native-svg';

import { logoMark } from './logoMark';
import { FIXED } from './theme/tokens';

type LogoProps = {
  size?: number;
  /** Die body colour; the tray colour on the home screen, the face colour on the splash. */
  body: string;
  /** Pip colour (except the amber centre pip). */
  pips: string;
  label?: string;
};

/** Two tumbled dice, with the signature amber centre pip. */
export function Logo({ size = 52, body, pips, label }: LogoProps) {
  return (
    <SvgXml
      width={size}
      height={size}
      xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">${logoMark({ body, pips, accent: FIXED.heldRing })}</svg>`}
      accessibilityLabel={label}
      accessible={!!label}
    />
  );
}
