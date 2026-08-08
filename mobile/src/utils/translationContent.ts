import { TranslationContent } from "./translationTypes";
import { ContentLang } from "../i18n/baza/categories";

// Bundlovani generisani prevodi po jeziku. Prazan fallback ako fajl ne postoji.
import en from "../data/translations/en.json";
import de from "../data/translations/de.json";
import es from "../data/translations/es.json";
import fr from "../data/translations/fr.json";
import it from "../data/translations/it.json";
import pt from "../data/translations/pt.json";
import sr from "../data/translations/sr.json";

const EMPTY: TranslationContent = {};

const CONTENT: Record<ContentLang, TranslationContent> = {
  en,
  de,
  es,
  fr,
  it,
  pt,
  sr,
};

export function translationContentFor(lang: ContentLang): TranslationContent {
  return CONTENT[lang] ?? EMPTY;
}
