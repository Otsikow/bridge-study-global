import en from "./locales/en";
import de from "./locales/de";
import fr from "./locales/fr";
import pt from "./locales/pt";
import sw from "./locales/sw";
import es from "./locales/es";
import zh from "./locales/zh";
import hi from "./locales/hi";
import ar from "./locales/ar";

export const languageList = ["en", "de", "fr", "pt", "sw", "es", "zh", "hi", "ar"] as const;

export type SupportedLanguage = typeof languageList[number];

export const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  pt: { translation: pt },
  sw: { translation: sw },
  es: { translation: es },
  zh: { translation: zh },
  hi: { translation: hi },
  ar: { translation: ar },
} as const;

export type AppResource = typeof resources;
