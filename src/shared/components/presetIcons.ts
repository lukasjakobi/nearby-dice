import { PresetId } from '@/domain';
import { IconName } from '@/ui';

/** Each preset's icon on its tile and on the mode card. */
export const PRESET_ICON: Record<PresetId, IconName> = {
  [PresetId.Classic]: IconName.DiceThree,
  [PresetId.TopToBottom]: IconName.ListDown,
  [PresetId.Blitz]: IconName.Bolt,
  [PresetId.SameDice]: IconName.Copy,
  [PresetId.Triple]: IconName.Layers,
  [PresetId.Yatzy]: IconName.Star,
  [PresetId.ClassicXl]: IconName.Plus,
  [PresetId.LuckyNumber]: IconName.Target,
};
