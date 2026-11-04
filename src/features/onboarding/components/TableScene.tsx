import { View } from 'react-native';

import { PlayerColor } from '@/domain';
import { alpha, Avatar, Bob, DieFace, FIXED, PLAYER_COLOR_HEX, useTheme } from '@/ui';

/** Friends around the table; where each sits, as an offset from the table's middle. */
const SEATS = [
  { initial: 'L', color: PlayerColor.Amber, x: -150, y: 6, delay: 0 },
  { initial: 'A', color: PlayerColor.Sky, x: -62, y: -104, delay: 400 },
  { initial: 'J', color: PlayerColor.Coral, x: 62, y: -104, delay: 800 },
  { initial: 'M', color: PlayerColor.Mint, x: 150, y: 6, delay: 1200 },
];
const DICE = [
  { value: 5, tilt: -10, delay: 200 },
  { value: 3, tilt: 6, delay: 600 },
  { value: 6, tilt: -4, delay: 1000 },
];
const AVATAR = 56;
const TABLE = { width: 300, height: 170 };
/** The table's middle, from the top of the scene. */
const MIDDLE = 186;
/** How far from a player towards the middle their phone lies. */
const REACH = 0.42;
const PHONE = { width: 34, height: 22 };

/** The first slide's picture: one table, everyone's own phone lit in front of them, dice between. */
export function TableScene() {
  const { colors } = useTheme();
  const at = (x: number, y: number, width: number, height: number) => ({
    position: 'absolute' as const,
    left: '50%' as const,
    marginLeft: x - width / 2,
    top: MIDDLE + y - height / 2,
  });

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ height: MIDDLE + TABLE.height / 2 + 8 }}
    >
      <View
        style={{
          ...at(0, 0, TABLE.width, TABLE.height),
          ...TABLE,
          borderRadius: TABLE.height,
          backgroundColor: colors.felt,
          borderWidth: 4,
          borderColor: alpha(FIXED.onFelt, 0.08),
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingTop: 18,
        }}
      >
        {DICE.map((die, i) => (
          <Bob key={i} tilt={die.tilt} delayMs={die.delay}>
            <DieFace value={die.value} size={46} />
          </Bob>
        ))}
      </View>
      {SEATS.map((seat) => (
        <View key={seat.initial}>
          {/* Their phone, lying on the table and lit in their colour. */}
          <View
            style={{
              ...at(seat.x * (1 - REACH), seat.y * (1 - REACH), PHONE.width, PHONE.height),
              ...PHONE,
              borderRadius: 6,
              borderWidth: 3,
              borderColor: FIXED.brand,
              backgroundColor: PLAYER_COLOR_HEX[seat.color],
              transform: [{ rotate: `${seat.x / 12}deg` }],
            }}
          />
          <View style={at(seat.x, seat.y, AVATAR, AVATAR)}>
            <Bob distance={3} delayMs={seat.delay}>
              <View style={{ borderRadius: AVATAR, borderWidth: 3, borderColor: colors.bg }}>
                <Avatar
                  initial={seat.initial}
                  color={PLAYER_COLOR_HEX[seat.color]}
                  size={AVATAR - 6}
                />
              </View>
            </Bob>
          </View>
        </View>
      ))}
    </View>
  );
}
