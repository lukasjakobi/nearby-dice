import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

import { FadeIn } from './FadeIn';
import { useTheme } from './theme/ThemeProvider';
import type { ColorToken } from './theme/tokens';

type ScreenProps = {
  children: ReactNode;
  background?: ColorToken;
  edges?: Edge[];
  /** Moves the content above the keyboard (screens with text fields). */
  keyboardAvoiding?: boolean;
};

/** Safe-area screen frame with the themed background and the standard fade-in. */
export function Screen({
  children,
  background = 'bg',
  edges = ['top', 'bottom'],
  keyboardAvoiding = false,
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors[background] }}>
      <FadeIn style={{ flex: 1 }}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {children}
          </KeyboardAvoidingView>
        ) : (
          children
        )}
      </FadeIn>
    </SafeAreaView>
  );
}
