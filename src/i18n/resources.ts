import en from "./locales/en";
import de from "./locales/de";
import fr from "./locales/fr";
import pt from "./locales/pt";
import it from "./locales/it";

export const languageList = ["en", "fr", "de", "pt", "it"] as const;

export type SupportedLanguage = typeof languageList[number];

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  it: { translation: it },
} as const;

export type AppResource = typeof resources;
