import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, useAnimatedValue } from 'react-native';

import { FIXED, Logo, Spinner, useTheme } from '@/ui';

const SPLASH_MS = 1500;

/** The logo on graphite for about 1.5 s at app start, then a fade. */
export function LaunchSplash() {
  const { t } = useTranslation();
  const { reduceMotion } = useTheme();
  const [visible, setVisible] = useState(true);
  const opacity = useAnimatedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: reduceMotion ? 0 : 250,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, SPLASH_MS);

    return () => clearTimeout(timer);
  }, [opacity, reduceMotion]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splash, { opacity }]} accessibilityLabel={t('common.appName')}>
      <Logo size={104} body={FIXED.dieFace} pips={FIXED.brand} label={t('common.appName')} />
      <Spinner color="#FFFFFF" size={28} strokeWidth={2.4} label={t('common.loading')} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: FIXED.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 1000,
  },
});
