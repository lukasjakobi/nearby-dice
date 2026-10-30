import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { i18n } from '@/i18n';

import { SwitchList } from './SwitchList';
import type { SwitchKey, SwitchRow } from './SwitchList';

const meta: Meta<typeof SwitchList> = {
  title: 'Shared/Settings/SwitchList',
  component: SwitchList,
  args: { onToggle: fn(), onVolume: fn() },
  // The rows answer like the settings store: switches flip, sliders move.
  render: function LiveSwitches(args) {
    const [state, setState] = useState({
      sound: { value: true, volume: 0.8 },
      music: { value: false, volume: 0.5 },
      haptics: { value: true },
      keepAwake: { value: false },
    });
    const rows: SwitchRow[] = (['sound', 'music', 'haptics', 'keepAwake'] as const).map((key) => ({
      key,
      label: i18n.t(`settings.${key}`),
      ...state[key],
    }));
    const update = (key: SwitchKey, patch: Partial<SwitchRow>) =>
      setState((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

    return (
      <SwitchList
        rows={rows}
        onToggle={(key) => {
          update(key, { value: !state[key].value });
          args.onToggle(key);
        }}
        onVolume={(key, volume) => {
          update(key, { volume });
          args.onVolume?.(key, volume);
        }}
      />
    );
  },
};

export default meta;

/** "Spiel" in Settings; turning sound or music on shows its level. */
export const Settings: StoryObj<typeof SwitchList> = {};
