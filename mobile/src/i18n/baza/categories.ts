// Prevod sadržaja baze: kategorije recepata.
// Ključ = engleska vrednost iz recipes.json. Vrednost = prikaz na datom jeziku.
// Neka ostane prazno/engleski ako prevod ne postoji (fallback na "en").
export type ContentLang = "en" | "de" | "es" | "fr" | "it" | "pt" | "sr";

export const CATEGORY_LABELS: Record<string, Partial<Record<ContentLang, string>>> = {
  Beef: { de: "Rindfleisch", es: "Ternera", fr: "Bœuf", it: "Manzo", pt: "Carne bovina", sr: "Govedina" },
  Breakfast: { de: "Frühstück", es: "Desayuno", fr: "Petit-déjeuner", it: "Colazione", pt: "Café da manhã", sr: "Doručak" },
  Chicken: { de: "Hähnchen", es: "Pollo", fr: "Poulet", it: "Pollo", pt: "Frango", sr: "Piletina" },
  Dessert: { de: "Nachspeise", es: "Postre", fr: "Dessert", it: "Dolce", pt: "Sobremesa", sr: "Desert" },
  Goat: { de: "Ziege", es: "Cabra", fr: "Chèvre", it: "Capra", pt: "Cabra", sr: "Kozje meso" },
  Lamb: { de: "Lamm", es: "Cordero", fr: "Agneau", it: "Agnello", pt: "Cordeiro", sr: "Jagnjetina" },
  Miscellaneous: { de: "Sonstiges", es: "Misceláneo", fr: "Divers", it: "Varie", pt: "Diversos", sr: "Ostalo" },
  Pasta: { de: "Pasta", es: "Pasta", fr: "Pâtes", it: "Pasta", pt: "Massa", sr: "Testenina" },
  Pork: { de: "Schweinefleisch", es: "Cerdo", fr: "Porc", it: "Maiale", pt: "Porco", sr: "Svinjetina" },
  Seafood: { de: "Meeresfrüchte", es: "Marisco", fr: "Fruits de mer", it: "Frutti di mare", pt: "Frutos do mar", sr: "Morski plodovi" },
  Side: { de: "Beilage", es: "Guarnición", fr: "Accompagnement", it: "Contorno", pt: "Acompanhamento", sr: "Prilog" },
  Starter: { de: "Vorspeise", es: "Entrante", fr: "Entrée", it: "Antipasto", pt: "Entrada", sr: "Predjelo" },
  Vegan: { de: "Vegan", es: "Vegano", fr: "Végane", it: "Vegano", pt: "Vegano", sr: "Vegansko" },
  Vegetarian: { de: "Vegetarisch", es: "Vegetariano", fr: "Végétarien", it: "Vegetariano", pt: "Vegetariano", sr: "Vegetarijansko" },
};
