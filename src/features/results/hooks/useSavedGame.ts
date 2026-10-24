import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useStatsStore } from '@/store';
import { navigate } from '@/shared';

import { buildSavedGame } from '../view';

/** The saved game named by the `id` param; `null` once it is no longer kept. */
export function useSavedGame() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const saved = useStatsStore((s) => s.recent.find((game) => game.id === id) ?? null);
  const view = useMemo(() => (saved ? buildSavedGame(t, saved) : null), [saved, t]);

  return { view, back: () => navigate.back() };
}
