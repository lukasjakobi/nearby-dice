import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Overrides Android's hardware back while the screen is focused (open a leave
 * dialog, a menu sheet, or nothing during the countdown). iOS swipe-back is
 * disabled for session screens in their layout.
 */
export function useBackAction(onBack: () => void): void {
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        onBack();

        return true;
      });

      return () => subscription.remove();
    }, [onBack]),
  );
}
