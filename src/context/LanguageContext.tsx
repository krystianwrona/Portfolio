'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, ReactNode } from 'react';
import { translations } from '@/translations';

type Lang = 'en' | 'pl';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// The saved choice lives in localStorage, which is an external store: React
// subscribes to it instead of copying it into state from an effect. The server
// (and the hydration pass) always renders English; a saved 'pl' takes over
// right after hydration, exactly as before.
const STORAGE_KEY = 'lang';
const CHANGE_EVENT = 'portfolio:lang';

// This tab's last choice, for when storage is blocked (disabled site data):
// the switch must still work, it just will not be remembered.
let sessionLang: Lang | null = null;

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pl' || saved === 'en') return saved;
  } catch {
    // fall through to the in-memory choice
  }
  return sessionLang ?? 'en';
}

function subscribe(onChange: () => void) {
  // 'storage' keeps other open tabs in step; the custom event covers this one.
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, (): Lang => 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (newLang: Lang) => {
    sessionLang = newLang;
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Not persisted, but the switch below still applies to this tab.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
