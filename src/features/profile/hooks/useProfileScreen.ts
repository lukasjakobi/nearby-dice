import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useProfileStore } from '@/store';
import { navigate, ProfileMode, useProfileForm } from '@/shared';

const RETURN_AFTER_SAVE_MS = 1000;

export function useProfileScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: ProfileMode }>();
  const stored = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const resetProfile = useProfileStore((s) => s.resetProfile);
  const mode = modeParam === ProfileMode.Create || !stored ? ProfileMode.Create : ProfileMode.Edit;
  const form = useProfileForm(stored);
  const [saved, setSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelReturn = () => {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    setSaved(false);
  };

  useEffect(() => cancelReturn, []);

  return {
    mode,
    form: {
      ...form,
      // Any edit after saving cancels the automatic return to Start.
      setName: (name: string) => {
        cancelReturn();
        form.setName(name);
      },
      setColor: (color: Parameters<typeof form.setColor>[0]) => {
        cancelReturn();
        form.setColor(color);
      },
    },
    saved,
    save: () => {
      if (!form.valid) return;
      saveProfile(form.profile());
      setSaved(true);
      returnTimer.current = setTimeout(() => navigate.back(), RETURN_AFTER_SAVE_MS);
    },
    resetOpen,
    askReset: () => setResetOpen(true),
    cancelReset: () => setResetOpen(false),
    confirmReset: () => {
      setResetOpen(false);
      cancelReturn();
      resetProfile();
      form.reset();
    },
    back: () => navigate.back(),
  };
}
