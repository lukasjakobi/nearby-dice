import { Pressable, View } from 'react-native';

import { useTheme } from './theme/ThemeProvider';

type SwitchProps = { value: boolean; onChange: (value: boolean) => void; label: string };

/** The design's switch: 52×30 track, white knob; 44 pt touch target. */
export function Switch({ value, onChange, label }: SwitchProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={{ width: 56, height: 44, justifyContent: 'center' }}
    >
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          backgroundColor: value ? colors.primary : colors.control,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 25 : 3,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </View>
    </Pressable>
  );
}
