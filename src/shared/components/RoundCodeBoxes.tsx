import { View } from 'react-native';

import { Font, Text, fontFamily } from '@/ui';

type RoundCodeBoxesProps = {
  code: string;
  /** Box width; height and font follow. */
  boxWidth?: number;
};

/** The round code as four large translucent boxes on a primary background. */
export function RoundCodeBoxes({ code, boxWidth = 62 }: RoundCodeBoxesProps) {
  const height = Math.round(boxWidth * 1.29);

  return (
    <View style={{ flexDirection: 'row', gap: 10 }} accessible={false}>
      {[...code].map((char, i) => (
        <View
          key={i}
          style={{
            width: boxWidth,
            height,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            color="onPrimary"
            size={Math.round(boxWidth * 0.84)}
            style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: height }}
          >
            {char}
          </Text>
        </View>
      ))}
    </View>
  );
}
