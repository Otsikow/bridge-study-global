import { ReactNode, createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { languageList } from "@/i18n";
import type { SupportedLanguage } from "@/i18n/resources";

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  availableLanguages: SupportedLanguage[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "app.language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const cached = window.localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (cached && languageList.includes(cached)) {
      return cached;
    }

    const browserLanguage = (navigator.language || navigator.languages?.[0] || "en").split("-")[0];
    if (languageList.includes(browserLanguage as SupportedLanguage)) {
      return browserLanguage as SupportedLanguage;
    }

    return "en";
  });
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const normalized = (lng || "en").split("-")[0] as SupportedLanguage;
      setLanguageState(languageList.includes(normalized) ? normalized : "en");
    };

    i18n.on("languageChanged", handleLanguageChanged);

    const initial = (i18n.language || "en").split("-")[0] as SupportedLanguage;
    if (languageList.includes(initial) && initial !== language) {
      setLanguageState(initial);
    }

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [language]);

  const changeLanguage = useCallback((lng: SupportedLanguage) => {
    if (!languageList.includes(lng)) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lng);
    }
    void i18n.changeLanguage(lng);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: changeLanguage,
      availableLanguages: [...languageList],
    }),
    [language, changeLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
