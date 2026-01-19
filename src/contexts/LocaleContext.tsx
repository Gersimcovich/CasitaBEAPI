'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Locale,
  Currency,
  Country,
  countries,
  translations,
  Translations,
  exchangeRates,
  currencySymbols,
} from '@/i18n/translations';

interface LocaleContextType {
  locale: Locale;
  currency: Currency;
  country: Country;
  t: Translations;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setCountry: (countryCode: string) => void;
  formatPrice: (priceUSD: number) => string;
  countries: Country[];
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = 'casita-locale-preferences';

interface StoredPreferences {
  locale: Locale;
  currency: Currency;
  countryCode: string;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [country, setCountryState] = useState<Country>(countries[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from storage or detect from IP
  useEffect(() => {
    async function initializeLocale() {
      // First, check localStorage for saved preferences
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const prefs: StoredPreferences = JSON.parse(stored);
          const foundCountry = countries.find(c => c.code === prefs.countryCode);
          if (foundCountry) {
            setLocaleState(prefs.locale);
            setCurrencyState(prefs.currency);
            setCountryState(foundCountry);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing stored preferences:', e);
        }
      }

      // If no stored preferences, detect from IP
      try {
        const response = await fetch('/api/detect-location');
        const data = await response.json();

        if (data.success && data.countryCode) {
          const detectedCountry = countries.find(c => c.code === data.countryCode);
          if (detectedCountry) {
            setLocaleState(detectedCountry.locale);
            setCurrencyState(detectedCountry.currency);
            setCountryState(detectedCountry);
          }
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        // Default to English/USD if detection fails
      }

      setIsLoading(false);
    }

    initializeLocale();
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newLocale: Locale, newCurrency: Currency, countryCode: string) => {
    const prefs: StoredPreferences = {
      locale: newLocale,
      currency: newCurrency,
      countryCode,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    savePreferences(newLocale, currency, country.code);
  }, [currency, country.code, savePreferences]);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    savePreferences(locale, newCurrency, country.code);
  }, [locale, country.code, savePreferences]);

  const setCountry = useCallback((countryCode: string) => {
    const newCountry = countries.find(c => c.code === countryCode);
    if (newCountry) {
      setCountryState(newCountry);
      setLocaleState(newCountry.locale);
      setCurrencyState(newCountry.currency);
      savePreferences(newCountry.locale, newCountry.currency, newCountry.code);
    }
  }, [savePreferences]);

  const formatPrice = useCallback((priceUSD: number) => {
    const convertedPrice = priceUSD * exchangeRates[currency];
    const symbol = currencySymbols[currency];

    // Format based on currency
    if (currency === 'COP' || currency === 'ARS') {
      // Use thousands separator, no decimals for large currencies
      return `${symbol}${Math.round(convertedPrice).toLocaleString()}`;
    }

    return `${symbol}${convertedPrice.toFixed(0)}`;
  }, [currency]);

  const t = translations[locale];

  return (
    <LocaleContext.Provider
      value={{
        locale,
        currency,
        country,
        t,
        setLocale,
        setCurrency,
        setCountry,
        formatPrice,
        countries,
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
