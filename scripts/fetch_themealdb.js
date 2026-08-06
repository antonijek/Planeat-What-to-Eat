/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const API_BASE = "https://www.themealdb.com/api/json/v1/1/";
const DEFAULT_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

const DIFFICULTY_MAP = {
  Easy: "lako",
  Medium: "srednje",
  Hard: "teško",
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function toDifficulty(ingredientCount) {
  if (ingredientCount <= 8) return "lako";
  if (ingredientCount <= 14) return "srednje";
  return "teško";
}

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`] || "";
    if (!name || !name.trim()) continue;
    ingredients.push({
      name: name.trim(),
      measure: measure.trim(),
      amount: 1,
      unit: "porcija",
    });
  }
  return ingredients;
}

function mapMeal(meal) {
  const ingredients = extractIngredients(meal);
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory || "Ostalo",
    area: meal.strArea || "",
    prepTime: 30,
    difficulty: toDifficulty(ingredients.length),
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    ingredients,
    instructions: (meal.strInstructions || "")
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*STEP\s*\d*\s*[:.-]?\s*/i, "").trim())
      .filter(Boolean),
    imageUrl: meal.strMealThumb || "",
    source: meal.strSource || "",
    dietaryTags: (meal.strTags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
  };
}

async function fetchAll() {
  const seen = new Map();
  const foundIds = new Set();

  // 1) Pretraga po prvom slovu (pokriva najširi opseg)
  const letters = process.env.LETTERS ? process.env.LETTERS.split(",") : DEFAULT_LETTERS;
  for (const letter of letters) {
    try {
      const data = await fetchJson(`${API_BASE}search.php?f=${letter}`);
      if (data && data.meals) {
        for (const meal of data.meals) {
          if (!foundIds.has(meal.idMeal)) {
            foundIds.add(meal.idMeal);
            seen.set(meal.idMeal, mapMeal(meal));
          }
        }
      }
    } catch (e) {
      console.warn(`Slovo "${letter}" preskočeno: ${e.message}`);
    }
  }

  // 2) Ukloni duplikate po nazivu
  const byName = new Map();
  for (const recipe of seen.values()) {
    const key = recipe.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, recipe);
  }

  const recipes = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));

  const outputPath = path.resolve(__dirname, "../data/recipes.json");
  const payload = {
    version: 1,
    meta: {
      source: "TheMealDB API",
      lastUpdated: new Date().toISOString(),
      recipeCount: recipes.length,
    },
    recipes,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`✅ Sačuvano ${recipes.length} recepata u data/recipes.json`);
}

fetchAll().catch((e) => {
  console.error("❌ Greška:", e.message);
  process.exit(1);
});
