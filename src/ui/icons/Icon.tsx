import Svg, { Circle, Path } from 'react-native-svg';

export enum IconName {
  Back = 'back',
  Close = 'close',
  Settings = 'settings',
  Menu = 'menu',
  Trophy = 'trophy',
  Cup = 'cup',
  Broadcast = 'broadcast',
  Search = 'search',
  Refresh = 'refresh',
  Check = 'check',
  CheckCircle = 'check-circle',
  CloseCircle = 'close-circle',
  Warning = 'warning',
  AlertCircle = 'alert-circle',
  Plus = 'plus',
  ChevronDown = 'chevron-down',
  ChevronRight = 'chevron-right',
  Pencil = 'pencil',
  More = 'more',
  Bluetooth = 'bluetooth',
  Ban = 'ban',
  History = 'history',
  User = 'user',
  ArrowDown = 'arrow-down',
  Star = 'star',
  Dice = 'dice',
  Crown = 'crown',
  Target = 'target',
  // Host setup presets
  DiceThree = 'dice-three',
  ListDown = 'list-down',
  Bolt = 'bolt',
  Copy = 'copy',
  Layers = 'layers',
}

enum ShapeKind {
  Path = 'path',
  Circle = 'circle',
}

type Shape =
  | { kind: ShapeKind.Path; d: string; filled?: boolean }
  | { kind: ShapeKind.Circle; cx: number; cy: number; r: number; filled?: boolean };

const path = (d: string, filled = false): Shape => ({ kind: ShapeKind.Path, d, filled });
const circle = (cx: number, cy: number, r: number, filled = false): Shape => ({
  kind: ShapeKind.Circle,
  cx,
  cy,
  r,
  filled,
});

/** Single-colour stroke icons on a 24×24 grid (from the design). */
const ICONS: Record<IconName, Shape[]> = {
  [IconName.Back]: [path('M15 5l-7 7 7 7')],
  [IconName.Refresh]: [path('M20 7v5h-5M20 12a8 8 0 1 0-2.3 5.7')],
  [IconName.Close]: [path('M6 6l12 12M18 6L6 18')],
  [IconName.Settings]: [
    circle(12, 12, 3),
    path(
      'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    ),
  ],
  [IconName.Menu]: [path('M4 7h16M4 12h16M4 17h16')],
  [IconName.Trophy]: [
    path(
      'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4',
    ),
  ],
  [IconName.Cup]: [
    path('M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3'),
  ],
  [IconName.Broadcast]: [
    path('M5 12.5a10 10 0 0 1 14 0'),
    path('M8.5 16a5 5 0 0 1 7 0'),
    path('M2 9a14 14 0 0 1 20 0'),
    circle(12, 19.5, 1.2, true),
  ],
  [IconName.Search]: [circle(11, 11, 7), path('M20 20l-4-4')],
  [IconName.Check]: [path('M5 12.5l4.5 4.5L19 7.5')],
  [IconName.CheckCircle]: [circle(12, 12, 10), path('M8 12.5l3 3 5-6')],
  [IconName.CloseCircle]: [circle(12, 12, 10), path('M9 9l6 6M15 9l-6 6')],
  [IconName.Warning]: [path('M12 3l10 18H2z'), path('M12 10v5M12 18v.5')],
  [IconName.AlertCircle]: [circle(12, 12, 10), path('M12 7v6M12 16.5v.5')],
  [IconName.Plus]: [path('M12 5v14M5 12h14')],
  [IconName.ChevronDown]: [path('M6 9l6 6 6-6')],
  [IconName.ChevronRight]: [path('M9 6l6 6-6 6')],
  [IconName.Pencil]: [path('M4 20h4L19 9l-4-4L4 16z'), path('M13.5 6.5l4 4')],
  [IconName.More]: [circle(12, 5, 1.8, true), circle(12, 12, 1.8, true), circle(12, 19, 1.8, true)],
  [IconName.Bluetooth]: [path('M6.5 7.5l11 9-5.5 4.5V3l5.5 4.5-11 9')],
  [IconName.Ban]: [circle(12, 12, 10), path('M5 5l14 14')],
  [IconName.History]: [path('M3 12a9 9 0 1 0 3-6.7'), path('M3 4v5h5'), path('M12 8v4l3 2')],
  [IconName.User]: [circle(12, 8, 4), path('M4 21a8 8 0 0 1 16 0')],
  [IconName.ArrowDown]: [path('M12 4v14M6 12l6 6 6-6')],
  [IconName.Star]: [path('M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z')],
  [IconName.Dice]: [
    path('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'),
    path('M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M8.5 15.5h.01M15.5 8.5h.01'),
  ],
  [IconName.Crown]: [path('M3 18l-1-11 5 4 5-7 5 7 5-4-1 11z', true)],
  [IconName.Target]: [circle(12, 12, 9), circle(12, 12, 5), circle(12, 12, 1.5, true)],
  [IconName.DiceThree]: [
    path('M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z'),
    circle(9, 9, 1, true),
    circle(12, 12, 1, true),
    circle(15, 15, 1, true),
  ],
  [IconName.ListDown]: [path('M5 6h9M5 12h9M5 18h9'), path('M19 7v10M16.5 14.5L19 17l2.5-2.5')],
  [IconName.Bolt]: [path('M13 3L5 13.5h6L10 21l8-10.5h-6z')],
  [IconName.Copy]: [
    path('M6.5 8h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3z'),
    path('M9.5 8V7a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3'),
  ],
  [IconName.Layers]: [path('M12 4l9 5-9 5-9-5z'), path('M3 13.5l9 5 9-5')],
};

type IconProps = {
  name: IconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

/** Decorative by default; give the surrounding control the accessibility label. */
export function Icon({ name, color, size = 24, strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {ICONS[name].map((shape, i) =>
        shape.kind === ShapeKind.Path ? (
          <Path key={i} d={shape.d} fill={shape.filled ? color : 'none'} />
        ) : (
          <Circle
            key={i}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.filled ? color : 'none'}
            stroke={shape.filled ? 'none' : color}
          />
        ),
      )}
    </Svg>
  );
}
