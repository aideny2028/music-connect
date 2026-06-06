import { en } from './en';
import { zhHk } from './zh-hk';

export const translations = { en, 'zh-hk': zhHk };
export type Locale = 'en' | 'zh-hk';
export type { Translations } from './en';

export function getT(locale: Locale) {
  return translations[locale] ?? translations.en;
}
