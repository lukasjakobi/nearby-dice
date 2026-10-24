import { useLocales } from 'expo-localization';
import { useEffect } from 'react';

import { i18n, localeFor } from '@/i18n';
import { useSettingsStore } from '@/store';

export function useAppLanguage() {
  const mode = useSettingsStore((s) => s.languageMode);
  const deviceLanguages = useLocales().map((locale) => locale.languageCode);
  const locale = localeFor(mode, deviceLanguages);

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);
}
