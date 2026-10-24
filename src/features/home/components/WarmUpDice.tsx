import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { rollDie } from '@/domain';
import { DieFace } from '@/ui';
import { FeltTray } from '@/shared';

const TILTS = [-4, 3, -2, 4, -3];
const SHAKE_MS = 320;

/** Decorative tray on Start: tap a die to re-roll just that die. */
export function WarmUpDice() {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => Array.from(TILTS, () => rollDie(Math.random)));
  const [shakes, setShakes] = useState([0, 0, 0, 0, 0]);
  const busy = useRef(false);

  const roll = (index: number) => {
    if (busy.current) return;
    busy.current = true;
    setShakes((s) => s.map((k, i) => (i === index ? k + 1 : k)));
    setTimeout(() => {
      setValues((v) => v.map((value, i) => (i === index ? rollDie(Math.random) : value)));
      busy.current = false;
    }, SHAKE_MS);
  };

  return (
    <FeltTray>
      <View
        accessibilityRole="none"
        accessibilityLabel={t('home.diceTray')}
        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      >
        {values.map((value, i) => (
          <Pressable
            key={i}
            onPress={() => roll(i)}
            accessibilityRole="button"
            accessibilityLabel={t('home.dieLabel', { n: i + 1, value })}
          >
            <DieFace value={value} tilt={TILTS[i]} shakeKey={shakes[i]} />
          </Pressable>
        ))}
      </View>
    </FeltTray>
  );
}
