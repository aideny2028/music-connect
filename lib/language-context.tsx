'use client';

/**
 * lib/language-context.tsx — Bilingual i18n context (EN / 繁中).
 *
 * Provides a React context wrapping the entire app with the current locale
 * ('en' or 'zh-hk') and a setLocale() function. The locale preference is
 * persisted in localStorage under 'mc-locale'. All UI strings are accessed
 * via the t object returned by useLanguage() — never hardcode English strings
 * in components directly.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, getT, Translations } from './i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: getT('en'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('mc-locale') as Locale;
    if (saved === 'en' || saved === 'zh-hk') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('mc-locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: getT(locale) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
