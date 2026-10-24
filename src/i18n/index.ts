import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { listNames, possessive } from './format';
import { Locale } from './locale';
import de from './locales/de.json';
import en from './locales/en.json';

export type { TFunction } from 'i18next';
export { ago, listNames, playedOn } from './format';
export { Locale, localeFor } from './locale';

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { [Locale.German]: { translation: de }, [Locale.English]: { translation: en } },
  lng: Locale.English,
  fallbackLng: Locale.English,
  initAsync: false,
  interpolation: { escapeValue: false },
});

i18n.services.formatter?.add('possessive', (value: string, lng) => possessive(value, lng));
i18n.services.formatter?.add('names', (value: string[], lng) =>
  listNames(i18n.getFixedT(lng ?? Locale.English), value),
);
