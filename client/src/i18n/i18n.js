import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ta from "./ta.json";
import hi from "./hi.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
    hi: { translation: hi },
  },
  lng: localStorage.getItem("lang") || "ta",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => localStorage.setItem("lang", lng));

export default i18n;