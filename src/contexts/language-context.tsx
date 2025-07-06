
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import si from '@/locales/si.json';

type Locale = 'en' | 'si';

interface LanguageContextType {
  locale: Locale;
  changeLocale: (locale: Locale) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

const translations: { [key in Locale]: any } = { en, si };

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  changeLocale: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'si')) {
      setLocale(savedLocale);
      document.documentElement.lang = savedLocale;
    }
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
    let translation = translations[locale][key] || key;
    if (replacements) {
      Object.keys(replacements).forEach((repKey) => {
        translation = translation.replace(`{${repKey}}`, String(replacements[repKey]));
      });
    }
    return translation;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, changeLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
