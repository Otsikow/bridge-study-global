import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources, languageList } from "./resources";

const fallbackLng = "en";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng,
    supportedLngs: languageList,
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
      lookupLocalStorage: "app.language",
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
    returnNull: false,
    returnEmptyString: false,
    cleanCode: true,
  });

export { languageList };
export default i18n;
