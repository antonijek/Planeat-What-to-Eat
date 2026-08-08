import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./en";
import de from "./de";
import fr from "./fr";
import it from "./it";
import es from "./es";
import pt from "./pt";
import sr from "./sr";

export const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  es: { translation: es },
  pt: { translation: pt },
  sr: { translation: sr },
} as const;

export type LanguageCode = keyof typeof resources;
export type TranslationKey = typeof en;

const native = getLocales()[0]?.languageCode;
const supported: LanguageCode[] = ["en", "de", "fr", "it", "es", "pt", "sr"];

i18n.use(initReactI18next).init({
  resources,
  lng: (supported as string[]).includes(native ?? "") ? (native as LanguageCode) : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
