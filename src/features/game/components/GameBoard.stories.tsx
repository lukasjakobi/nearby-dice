import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Category, PresetId } from '@/domain';
import { i18n } from '@/i18n';
import { ANTONIA } from '@/test/fixtures';
import { Screen } from '@/ui';

import { ActionBar } from './ActionBar';
import { Scorecard } from './Scorecard';
import { ScorecardScroll } from './ScorecardScroll';
import { GameHeader } from './GameHeader';
import { PlayerPills } from './PlayerPills';
import { FieldPick, SIX_PLAYERS, THREE_FIVES, gameScene } from './fixtures';
import type { Scene } from './fixtures';

/** Complete playing-screen context, so the design uses the space the app actually has. */
const meta: Meta<typeof Scorecard> = {
  title: 'Features/Game/GameBoard',
  component: Scorecard,
  parameters: { screen: true },
  args: {
    dimmed: false,
    onPick: fn(),
    onSelectSheet: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof Scorecard>;

/** Real view-builder data; selecting a field locks the dice and previews confirmation. */
function sceneStory(scene: Scene = {}, timer = false): Story {
  return {
    render: function PlayingScreen(args) {
      const [selected, setSelected] = useState<Category | null>(null);
      const [selectedSheet, setSelectedSheet] = useState(0);
      const [held, setHeld] = useState<number[]>([]);
      const [deadline] = useState(() => Date.now() + 25_000);
      const { view } = gameScene(i18n.t, {
        ...scene,
        selected: selected ?? scene.selected,
        local: { ...scene.local, sheetIndex: selectedSheet },
      });
      const cell = view.selectedCell;

      return (
        <View style={{ height: '100dvh' }}>
          <Screen edges={['top']}>
            <GameHeader roundLabel={view.roundLabel} onMenu={fn()} onScoreboard={fn()} />
            <PlayerPills pills={view.pills} onSelect={fn()} />
            <ScorecardScroll>
              <Scorecard
                {...args}
                sheet={view.sheet}
                dimmed={view.cardDimmed}
                onPick={(picked) => {
                  args.onPick(picked);
                  setSelected((previous) =>
                    previous === picked.category ? null : picked.category,
                  );
                }}
                onSelectSheet={(index) => {
                  args.onSelectSheet(index);
                  setSelected(null);
                  setSelectedSheet(index);
                }}
              />
            </ScorecardScroll>
            <ActionBar
              dice={view.dice.map((die, index) => ({ ...die, held: held.includes(index) }))}
              shakeKeys={[0, 0, 0, 0, 0]}
              control={view.control}
              timer={timer ? { deadline, limitMs: 30_000, lowMs: 10_000 } : null}
              confirm={
                cell
                  ? {
                      label: cell.label,
                      points: i18n.t('format.points', { count: Number(cell.value) }),
                      strike: Number(cell.value) === 0,
                      sending: false,
                    }
                  : null
              }
              onToggleHold={(index) =>
                setHeld((previous) =>
                  previous.includes(index)
                    ? previous.filter((value) => value !== index)
                    : [...previous, index],
                )
              }
              onRoll={fn()}
              onConfirm={fn()}
            />
          </Screen>
        </View>
      );
    },
  };
}

export const MyTurn: Story = sceneStory({ dice: THREE_FIVES });
/** Review at 360 × 640: the lower block follows the upper block, above the original dice tray. */
export const CompactPhone: Story = {
  ...sceneStory({ preset: PresetId.ClassicXl, dice: THREE_FIVES }),
  globals: { viewport: { value: 'small', isRotated: false } },
};
export const BeforeRoll: Story = sceneStory({ turns: 0 });
export const FieldSelected: Story = sceneStory({ dice: THREE_FIVES, selected: FieldPick.Best });
export const Strike: Story = sceneStory({ dice: THREE_FIVES, selected: FieldPick.Zero });
export const Waiting: Story = sceneStory({ dice: THREE_FIVES, me: ANTONIA });
export const Triple: Story = sceneStory({ preset: PresetId.Triple, dice: THREE_FIVES });
export const Yatzy: Story = sceneStory({ preset: PresetId.Yatzy, dice: THREE_FIVES });
export const SixPlayers: Story = sceneStory({ players: SIX_PLAYERS, dice: THREE_FIVES });
export const WithTimer: Story = sceneStory({ preset: PresetId.Blitz, dice: THREE_FIVES }, true);
