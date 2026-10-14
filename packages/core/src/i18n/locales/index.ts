import { Locale, TranslationDictionary } from '../i18n.types.js';
import { en } from './en.js';
import { bn } from './bn.js';
import { ar } from './ar.js';
import { hi } from './hi.js';

export { en, bn, ar, hi };

export const DICTIONARIES: Readonly<Record<Locale, TranslationDictionary>> = Object.freeze({
  en,
  bn,
  ar,
  hi,
});

export function getDictionary(locale: Locale): TranslationDictionary {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}
