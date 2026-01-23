'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, translations, Translations } from '@/i18n/translations';

interface LocaleContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  formatPrice: (priceUSD: number) => string;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = 'casita-locale-preferences';

interface StoredPreferences {
  locale: Locale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from storage
  useEffect(() => {
    async function initializeLocale() {
      // Check localStorage for saved locale preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const prefs: StoredPreferences = JSON.parse(stored);
          if (prefs.locale) {
            setLocaleState(prefs.locale);
          }
        } catch (e) {
          console.error('Error parsing stored preferences:', e);
        }
      }
      setIsLoading(false);
    }

    initializeLocale();
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newLocale: Locale) => {
    const prefs: StoredPreferences = {
      locale: newLocale,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    savePreferences(newLocale);
  }, [savePreferences]);

  // Always format prices in USD
  const formatPrice = useCallback((priceUSD: number) => {
    return `$${priceUSD.toFixed(0)}`;
  }, []);

  const t = translations[locale];

  return (
    <LocaleContext.Provider
      value={{
        locale,
        t,
        setLocale,
        formatPrice,
        isLoading,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
