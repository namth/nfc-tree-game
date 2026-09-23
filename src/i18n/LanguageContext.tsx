/**
 * Language Context & Translation Hook
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { translations } from './translations';
import { Preferences, AppLanguage } from '../storage/preferences';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'vi',
  setLanguage: () => {},
  t: (path: string) => path
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => Preferences.getLanguage());

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    Preferences.setLanguage(lang);
  };

  const t = useMemo(() => {
    return (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: any = translations[language] || translations.vi;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          // Fallback to Vietnamese if key missing in English
          let fallback: any = translations.vi;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              return path;
            }
          }
          current = fallback;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      let result = current;
      if (params) {
        for (const [paramKey, paramVal] of Object.entries(params)) {
          result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal));
        }
      }

      return result;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
