import en from "./locales/en";
import de from "./locales/de";
import fr from "./locales/fr";
import pt from "./locales/pt";

export const languageList = ["en", "fr", "de", "pt"] as const;

export type SupportedLanguage = typeof languageList[number];

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
} as const;

export type AppResource = typeof resources;
