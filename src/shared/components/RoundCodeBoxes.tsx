import { View } from 'react-native';

import { FIXED, Font, Text, fontFamily } from '@/ui';

/** Each character sits on its own die, tipped a little like dice thrown on the table. */
const TILTS = [-4, 3, -2, 4];

type RoundCodeBoxesProps = {
  code: string;
  /** Box width; height and font follow. */
  boxWidth?: number;
};

/** The round code as four large dice faces carrying a character each. */
export function RoundCodeBoxes({ code, boxWidth = 62 }: RoundCodeBoxesProps) {
  const height = Math.round(boxWidth * 1.12);

  return (
    <View style={{ flexDirection: 'row', gap: 12 }} accessible={false}>
      {[...code].map((char, i) => (
        <View
          key={i}
          style={{
            width: boxWidth,
            height,
            borderRadius: Math.round(boxWidth * 0.26),
            backgroundColor: FIXED.dieFace,
            borderBottomWidth: 4,
            borderBottomColor: FIXED.dieEdge,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: `${TILTS[i % TILTS.length]}deg` }],
          }}
        >
          <Text
            color={{ raw: FIXED.diePip }}
            size={Math.round(boxWidth * 0.72)}
            style={{ fontFamily: fontFamily(Font.Display, 700), lineHeight: height - 4 }}
          >
            {char}
          </Text>
        </View>
      ))}
    </View>
  );
}
