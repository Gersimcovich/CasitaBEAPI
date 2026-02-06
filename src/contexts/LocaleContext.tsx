'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, translations, Translations } from '@/i18n/translations';

interface LocaleContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  formatPrice: (priceUSD: number) => string;
  isLoading: boolean;
  detectedCountry: string | null;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = 'casita-locale-preferences';
const GEO_DETECTED_KEY = 'casita-geo-detected';

interface StoredPreferences {
  locale: Locale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  // Load preferences from storage or detect via geolocation
  useEffect(() => {
    async function initializeLocale() {
      // Check localStorage for saved locale preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const prefs: StoredPreferences = JSON.parse(stored);
          if (prefs.locale) {
            setLocaleState(prefs.locale);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing stored preferences:', e);
        }
      }

      // No saved preference - check if we already detected geo for this session
      const geoDetected = sessionStorage.getItem(GEO_DETECTED_KEY);
      if (geoDetected) {
        try {
          const geoData = JSON.parse(geoDetected);
          if (geoData.locale) {
            setLocaleState(geoData.locale);
            setDetectedCountry(geoData.country);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing geo detection:', e);
        }
      }

      // First visit - detect language via IP geolocation
      try {
        const response = await fetch('/api/geolocation');
        if (response.ok) {
          const data = await response.json();
          if (data.locale && ['en', 'es', 'pt', 'fr', 'de', 'it', 'ar', 'he', 'zh', 'ru'].includes(data.locale)) {
            setLocaleState(data.locale as Locale);
            setDetectedCountry(data.country);
            // Store in sessionStorage so we don't re-detect on every page load
            sessionStorage.setItem(GEO_DETECTED_KEY, JSON.stringify({
              locale: data.locale,
              country: data.country,
            }));
          }
        }
      } catch (e) {
        console.error('Error detecting locale via geolocation:', e);
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
        detectedCountry,
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
