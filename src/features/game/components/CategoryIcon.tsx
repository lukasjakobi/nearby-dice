import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Category } from '@/domain';

/** Pips on the 32×32 grid for the upper-block die icons. */
const PIPS: Record<number, [number, number][]> = {
  1: [[16, 16]],
  2: [
    [11, 11],
    [21, 21],
  ],
  3: [
    [11, 11],
    [16, 16],
    [21, 21],
  ],
  4: [
    [11, 11],
    [21, 11],
    [11, 21],
    [21, 21],
  ],
  5: [
    [11, 11],
    [21, 11],
    [16, 16],
    [11, 21],
    [21, 21],
  ],
  6: [
    [11, 10.5],
    [21, 10.5],
    [11, 16],
    [21, 16],
    [11, 21.5],
    [21, 21.5],
  ],
};

type Draw = (color: string) => ReactNode;

const stroke = { strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const smallDie = (color: string, x: number, y: number) => (
  <>
    <Rect
      x={x}
      y={y}
      width={12}
      height={12}
      rx={3}
      fill={color}
      fillOpacity={0.14}
      stroke={color}
      {...stroke}
    />
    <Circle cx={x + 6} cy={y + 6} r={1.6} fill={color} />
  </>
);

/** A 12×12 die with pips at offsets inside it. */
const pipDie = (color: string, x: number, y: number, pips: [number, number][]) => (
  <>
    <Rect
      x={x}
      y={y}
      width={12}
      height={12}
      rx={3}
      fill={color}
      fillOpacity={0.14}
      stroke={color}
      {...stroke}
    />
    {pips.map(([px, py], i) => (
      <Circle key={i} cx={x + px} cy={y + py} r={1.3} fill={color} />
    ))}
  </>
);

const TWO_PIPS: [number, number][] = [
  [3.5, 3.5],
  [8.5, 8.5],
];
const THREE_PIPS: [number, number][] = [
  [3.2, 3.2],
  [6, 6],
  [8.8, 8.8],
];

const steps = (color: string, bars: [number, number, number, number, number][]) => (
  <G fill={color}>
    {bars.map(([x, y, w, h, opacity], i) => (
      <Rect key={i} x={x} y={y} width={w} height={h} rx={1.4} fillOpacity={opacity} />
    ))}
  </G>
);

/** Single-colour illustrations of the lower block, drawn in the text colour. */
const LOWER: Partial<Record<Category, Draw>> = {
  [Category.ThreeOfAKind]: (c) => (
    <>
      <G transform="rotate(-14 8 20)">{smallDie(c, 2, 14)}</G>
      <G transform="rotate(14 24 20)">{smallDie(c, 18, 14)}</G>
      {smallDie(c, 10, 7)}
    </>
  ),
  [Category.FourOfAKind]: (c) => (
    <>
      {smallDie(c, 3, 3)}
      {smallDie(c, 17, 3)}
      {smallDie(c, 3, 17)}
      {smallDie(c, 17, 17)}
    </>
  ),
  [Category.OnePair]: (c) => (
    <>
      {smallDie(c, 3, 10)}
      {smallDie(c, 17, 10)}
    </>
  ),
  [Category.TwoPairs]: (c) => (
    <>
      {smallDie(c, 3, 3)}
      {smallDie(c, 17, 3)}
      <G opacity={0.6}>
        {smallDie(c, 3, 17)}
        {smallDie(c, 17, 17)}
      </G>
    </>
  ),
  [Category.FullHouse]: (c) => (
    <>
      <Rect
        x={6}
        y={15}
        width={20}
        height={13}
        rx={1.5}
        fill={c}
        fillOpacity={0.14}
        stroke={c}
        {...stroke}
      />
      <Path d="M3 16.5L16 4l13 12.5" fill="none" stroke={c} {...stroke} />
      <Rect x={13} y={20} width={6} height={8} rx={1.2} fill={c} />
    </>
  ),
  [Category.SmallStraight]: (c) =>
    steps(c, [
      [3, 20, 5.5, 9, 0.25],
      [9.8, 15, 5.5, 14, 0.45],
      [16.6, 10, 5.5, 19, 0.7],
      [23.4, 5, 5.5, 24, 1],
    ]),
  [Category.LargeStraight]: (c) => (
    <>
      {steps(c, [
        [2, 22, 4.8, 7, 0.2],
        [8, 18, 4.8, 11, 0.38],
        [14, 14, 4.8, 15, 0.56],
        [20, 10, 4.8, 19, 0.76],
        [26, 6, 4.8, 23, 1],
      ])}
      <Path d="M28.4 6V1.5l3.2 1.6-3.2 1.6" fill="none" stroke={c} {...stroke} strokeWidth={1.2} />
    </>
  ),
  [Category.Yatzy]: (c) => (
    <>
      <Path
        d="M16 2.5l4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.5L16 24.2 7.6 28.7l1.6-9.5L2.3 12.5l9.5-1.4z"
        fill={c}
        fillOpacity={0.16}
        stroke={c}
        {...stroke}
      />
      <Circle cx={16} cy={15.5} r={2.2} fill={c} />
    </>
  ),
  [Category.Chance]: (c) => (
    <G transform="rotate(10 16 16)">
      <Rect
        x={5}
        y={5}
        width={22}
        height={22}
        rx={6}
        fill={c}
        fillOpacity={0.14}
        stroke={c}
        {...stroke}
      />
      <SvgText
        x={16}
        y={22.5}
        textAnchor="middle"
        fontFamily="Fredoka_700Bold"
        fontSize={17}
        fill={c}
      >
        ?
      </SvgText>
    </G>
  ),
  [Category.Even]: (c) => (
    <>
      {pipDie(c, 3, 10, TWO_PIPS)}
      {pipDie(c, 17, 10, TWO_PIPS)}
    </>
  ),
  [Category.Odd]: (c) => (
    <>
      {pipDie(c, 3, 10, THREE_PIPS)}
      {pipDie(c, 17, 10, THREE_PIPS)}
    </>
  ),
  [Category.Mini]: (c) => (
    <>
      {smallDie(c, 4, 16)}
      <Path d="M23 6v18M18.5 19.5L23 24l4.5-4.5" fill="none" stroke={c} {...stroke} />
    </>
  ),
  [Category.LuckyNumber]: (c) => (
    <>
      {[
        [11.5, 11.5],
        [20.5, 11.5],
        [11.5, 20.5],
        [20.5, 20.5],
      ].map(([cx, cy], i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={5.2}
          fill={c}
          fillOpacity={0.14}
          stroke={c}
          {...stroke}
        />
      ))}
      <Path d="M18.5 22.5c2 2.5 4.5 5 8 6.5" fill="none" stroke={c} {...stroke} />
      <Circle cx={16} cy={16} r={2} fill={c} />
    </>
  ),
};

function upperDie(face: number): Draw {
  return function drawUpperDie(c) {
    return (
      <>
        <Rect
          x={4}
          y={4}
          width={24}
          height={24}
          rx={7}
          fill={c}
          fillOpacity={0.14}
          stroke={c}
          {...stroke}
        />
        {PIPS[face].map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={1.9} fill={c} />
        ))}
      </>
    );
  };
}

type CategoryIconProps = { category: Category; face: number | null; color: string; size: number };

export function CategoryIcon({ category, face, color, size }: CategoryIconProps) {
  const draw = face ? upperDie(face) : LOWER[category];

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessible={false}>
      {draw?.(color)}
    </Svg>
  );
}
