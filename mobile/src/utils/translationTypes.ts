// Tipovi generisanog prevodnog sadržaja baze (offline MT).
export interface TranslationContent {
  // ključ = englesko ime sastojka (lowercase), vrednost = prevod na datom jeziku
  ingredients?: Record<string, string>;
  // ključ = recipe.id
  recipes?: Record<string, { name?: string; instructions?: string[] }>;
}
