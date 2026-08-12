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

/** Jezici koji su dostupni u UI (kod + prikazni naziv). Jedini izvor istine. */
export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "sr", label: "Srpski" },
];

const native = getLocales()[0]?.languageCode;
const supported: LanguageCode[] = LANGUAGES.map((l) => l.code);

i18n.use(initReactI18next).init({
  resources,
  lng: (supported as string[]).includes(native ?? "") ? (native as LanguageCode) : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
