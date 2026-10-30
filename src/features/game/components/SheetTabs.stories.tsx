import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { PresetId } from '@/domain';
import { i18n } from '@/i18n';
import { ANTONIA } from '@/test/fixtures';

import { THREE_FIVES, gameScene } from './fixtures';
import type { Scene } from './fixtures';
import { SheetTabs } from './SheetTabs';

const sheet = (scene: Scene) =>
  gameScene(i18n.t, { preset: PresetId.Triple, turns: 12, dice: THREE_FIVES, ...scene }).view.sheet;

const meta: Meta<typeof SheetTabs> = {
  title: 'Features/Game/SheetTabs',
  component: SheetTabs,
  args: { onSelect: fn() },
};

export default meta;
type Story = StoryObj<typeof SheetTabs>;

/** My turn: I switch between my three sheets. */
export const MyTurn: Story = {
  render: (args) => {
    const s = sheet({});

    return <SheetTabs {...args} sheet={s} tabs={s.tabs!} />;
  },
};

/** Someone else's turn on their ×2 sheet: the tab follows them and carries their dot. */
export const FollowingTurn: Story = {
  render: (args) => {
    const s = sheet({ me: ANTONIA, local: { sheetIndex: 0 } });
    const marked = { ...s, selectedTab: 0, turnTab: { index: 1, label: s.tabs![1] } };

    return <SheetTabs {...args} sheet={marked} tabs={s.tabs!} />;
  },
};
