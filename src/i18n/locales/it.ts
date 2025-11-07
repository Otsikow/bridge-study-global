import en from "./en";

const it = {
  ...en,
  common: {
    ...en.common,
    languageNames: {
      ...en.common.languageNames,
      en: "Inglese",
      fr: "Francese",
      de: "Tedesco",
      pt: "Portoghese",
      it: "Italiano",
    },
  },
};

export default it;
