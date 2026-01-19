'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { currencyNames } from '@/i18n/translations';

export default function LocaleSelector() {
  const { country, currency, setCountry, setCurrency, countries, t, formatPrice } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'country' | 'currency'>('country');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const currencies = [
    { code: 'USD', name: currencyNames.USD },
    { code: 'CAD', name: currencyNames.CAD },
    { code: 'MXN', name: currencyNames.MXN },
    { code: 'ARS', name: currencyNames.ARS },
    { code: 'COP', name: currencyNames.COP },
    { code: 'BRL', name: currencyNames.BRL },
  ] as const;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--casita-gray-100)] transition-colors"
        aria-label={t.language.title}
      >
        <Globe className="w-5 h-5 text-[var(--casita-gray-600)]" />
        <span className="text-sm font-medium text-[var(--casita-gray-700)]">
          {country.flag} {currency}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--casita-gray-500)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[var(--casita-gray-200)] z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[var(--casita-gray-100)]">
            <h3 className="font-semibold text-[var(--casita-gray-900)]">{t.language.title}</h3>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--casita-gray-100)]">
            <button
              onClick={() => setActiveTab('country')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'country'
                  ? 'text-[var(--casita-orange)] border-b-2 border-[var(--casita-orange)]'
                  : 'text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)]'
              }`}
            >
              {t.language.selectCountry}
            </button>
            <button
              onClick={() => setActiveTab('currency')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'currency'
                  ? 'text-[var(--casita-orange)] border-b-2 border-[var(--casita-orange)]'
                  : 'text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)]'
              }`}
            >
              {t.language.currency}
            </button>
          </div>

          {/* Content */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === 'country' ? (
              <div className="p-2">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      country.code === c.code
                        ? 'bg-[var(--casita-orange-light)]'
                        : 'hover:bg-[var(--casita-gray-50)]'
                    }`}
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[var(--casita-gray-900)]">{c.nameLocal}</p>
                      <p className="text-xs text-[var(--casita-gray-500)]">
                        {c.currency} · {c.locale === 'en' ? 'English' : c.locale === 'es' ? 'Español' : 'Português'}
                      </p>
                    </div>
                    {country.code === c.code && (
                      <Check className="w-5 h-5 text-[var(--casita-orange)]" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                      currency === c.code
                        ? 'bg-[var(--casita-orange-light)]'
                        : 'hover:bg-[var(--casita-gray-50)]'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-[var(--casita-gray-900)]">{c.code}</p>
                      <p className="text-xs text-[var(--casita-gray-500)]">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--casita-gray-600)]">
                        {formatPrice(100)}
                      </span>
                      {currency === c.code && (
                        <Check className="w-5 h-5 text-[var(--casita-orange)]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
