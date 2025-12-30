"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "kasilink:preferences";

type LanguageCode = "EN" | "ZU" | "ST" | "VE";

type PreferencesState = {
  lowDataMode: boolean;
  largeText: boolean;
  language: LanguageCode;
  setLowDataMode: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setLanguage: (value: LanguageCode) => void;
  t: (key: keyof typeof dictionary) => string;
};

const dictionary = {
  home: { EN: "Home", ZU: "Ikhaya", ST: "Lehae", VE: "Hayani" },
  requests: { EN: "Requests", ZU: "Izicelo", ST: "Likopo", VE: "Zwikumbelo" },
  whatsapp: { EN: "WhatsApp", ZU: "WhatsApp", ST: "WhatsApp", VE: "WhatsApp" },
  account: { EN: "Account", ZU: "Akhawunti", ST: "Akhaonto", VE: "Akhawunti" },
  callMeBack: { EN: "Call me back", ZU: "Ngibize", ST: "Mpitse", VE: "Nnditshedzeni" },
  createRequest: { EN: "Create request", ZU: "Dala isicelo", ST: "Etsa kopo", VE: "Itani tshikumbelo" }
};

const PreferencesContext = createContext<PreferencesState | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [lowDataMode, setLowDataModeState] = useState(false);
  const [largeText, setLargeTextState] = useState(false);
  const [language, setLanguageState] = useState<LanguageCode>("EN");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<{
          lowDataMode: boolean;
          largeText: boolean;
          language: LanguageCode;
        }>;
        setLowDataModeState(Boolean(parsed.lowDataMode));
        setLargeTextState(Boolean(parsed.largeText));
        setLanguageState(parsed.language ?? "EN");
      } catch {
        setLowDataModeState(false);
        setLargeTextState(false);
        setLanguageState("EN");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lowDataMode, largeText, language })
    );
    document.documentElement.classList.toggle("low-data", lowDataMode);
    document.documentElement.classList.toggle("large-text", largeText);
  }, [language, largeText, lowDataMode]);

  const t = useMemo(
    () => (key: keyof typeof dictionary) => dictionary[key][language] ?? dictionary[key].EN,
    [language]
  );

  const value: PreferencesState = {
    lowDataMode,
    largeText,
    language,
    setLowDataMode: setLowDataModeState,
    setLargeText: setLargeTextState,
    setLanguage: setLanguageState,
    t
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
