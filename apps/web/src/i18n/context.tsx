'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Locale,
  TextDirection,
  SUPPORTED_LOCALES,
  TranslationDictionary,
  getDictionary,
  SupportedCurrencyCode,
  isSupportedCurrency,
} from './types';

interface I18nContextType {
  locale: Locale;
  dir: TextDirection;
  setLocale: (locale: Locale) => void;
  dict: TranslationDictionary;
  locales: typeof SUPPORTED_LOCALES;
  displayCurrency: SupportedCurrencyCode;
  setDisplayCurrency: (currency: SupportedCurrencyCode) => void;
  baseCurrency: 'AED';
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  dir: 'ltr',
  setLocale: () => {},
  dict: getDictionary('en'),
  locales: SUPPORTED_LOCALES,
  displayCurrency: 'AED',
  setDisplayCurrency: () => {},
  baseCurrency: 'AED',
});

const STORAGE_KEY = 'accounting_user_locale_pref';
const CURRENCY_STORAGE_KEY = 'accounting_user_currency_pref';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [displayCurrency, setDisplayCurrencyState] = useState<SupportedCurrencyCode>('AED');

  // Load user preferences on mount (user-level, client-side only)
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (savedLocale && SUPPORTED_LOCALES[savedLocale]) {
        setLocaleState(savedLocale);
      }
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as string | null;
      if (savedCurrency && isSupportedCurrency(savedCurrency)) {
        setDisplayCurrencyState(savedCurrency);
      }
    } catch {
      // Safe fallback if localStorage is disabled or restricted
    }
  }, []);

  // Update HTML document attributes for language and text direction
  useEffect(() => {
    const meta = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (SUPPORTED_LOCALES[newLocale]) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch {
        // Safe fallback
      }
    }
  };

  const setDisplayCurrency = (newCurrency: SupportedCurrencyCode) => {
    if (isSupportedCurrency(newCurrency)) {
      setDisplayCurrencyState(newCurrency);
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
      } catch {
        // Safe fallback
      }
    }
  };

  const dir = SUPPORTED_LOCALES[locale]?.dir || 'ltr';
  const dict = getDictionary(locale);

  const contextValue = useMemo<I18nContextType>(
    () => ({
      locale,
      dir,
      setLocale,
      dict,
      locales: SUPPORTED_LOCALES,
      displayCurrency,
      setDisplayCurrency,
      baseCurrency: 'AED',
    }),
    [locale, dir, dict, displayCurrency]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
