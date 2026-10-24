import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { initialOf, PlayerColor, validateName } from '@/domain';
import type { Profile } from '@/domain';

import { avatarOf } from '../view/avatar';
import type { AvatarView } from '../view/avatar';

export type ProfileForm = {
  name: string;
  color: PlayerColor;
  avatar: AvatarView;
  /** Shown only after the field was touched. */
  error: string | null;
  valid: boolean;
  setName: (name: string) => void;
  setColor: (color: PlayerColor) => void;
  reset: () => void;
  profile: () => Profile;
};

/** Name and colour with the spec's validation, shared by onboarding and the profile screen. */
export function useProfileForm(initial: Profile | null): ProfileForm {
  const { t } = useTranslation();
  const [name, setNameValue] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? PlayerColor.Amber);
  const [touched, setTouched] = useState(false);
  const problem = validateName(name);

  return {
    name,
    color,
    avatar: { ...avatarOf({ name, color }), initial: initialOf(name) },
    error: touched && problem ? t(`labels.nameProblem.${problem}`) : null,
    valid: problem === null,
    setName: (value) => {
      setNameValue(value);
      setTouched(true);
    },
    setColor,
    reset: () => {
      setNameValue('');
      setColor(PlayerColor.Amber);
      setTouched(false);
    },
    profile: () => ({ name: name.trim(), color }),
  };
}
