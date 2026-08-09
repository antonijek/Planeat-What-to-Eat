#!/usr/bin/env node
/**
 * Generiše prevode baze recepata (recepti + sastojci) na FR, ES, DE, IT, PT, SR.
 *
 * BEZ API KLJUČA I BEZ KARTICE — koristi lokalni offline prevodilac:
 *   - Argos Translate (argostranslate) za: fr, es, de, it, pt
 *   - OPUS-MT (perkan/shortL-opus-mt-tc-base-en-sr) za: sr
 *
 * Zahteva Python venv sa instaliranim paketima (argostranslate + transformers).
 * Putanja do venv pythona se čita iz env var MEALMATE_VENV_PYTHON (default ispod).
 *
 * Pokretanje:
 *   node scripts/translate_db.js [--languages fr,es,de,it,pt,sr] [--dry]
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SRC_RECIPES = path.join(ROOT, "data", "recipes.json");
const SRC_MAP = path.join(ROOT, "data", "ingredient_map.json");
const OUT_DIR = path.join(ROOT, "data", "translations");
const MOBILE_DIR = path.join(ROOT, "mobile", "src", "data", "translations");

// Python (venv) koji ima argostranslate + transformers.
// Postavi MEALMATE_PYTHON na python.exe iz venv-a, ili kreiraj .venv u korenu projekta.
const PY = process.env.MEALMATE_PYTHON || path.join(ROOT, ".venv", "Scripts", "python.exe");
if (!process.env.MEALMATE_PYTHON && !fs.existsSync(PY)) {
  console.error("Python not found at", PY, "\nSet MEALMATE_PYTHON to a venv python.exe that has argostranslate + transformers.");
  process.exit(1);
}

// Batch skripte se čuvaju u projektu (scripts/../.venv/)
const ARGOS_BATCH = path.join(__dirname, "..", ".venv", "argos_batch.py");
const OPUS_BATCH = path.join(__dirname, "..", ".venv", "opus_batch.py");

// jezik -> (batch skripta, py arg). Gemini za sve (uklj. srpski).
const BACKENDS = {
  fr: { script: "gemini_batch.py", arg: "French" },
  es: { script: "gemini_batch.py", arg: "Spanish" },
  de: { script: "gemini_batch.py", arg: "German" },
  it: { script: "gemini_batch.py", arg: "Italian" },
  pt: { script: "gemini_batch.py", arg: "Portuguese" },
  sr: { script: "gemini_batch.py", arg: "Serbian" },
};

const BATCH = 200;

function runPython(script, arg, payload) {
  const pyScript = path.join(path.dirname(ARGOS_BATCH), script);
  const input = JSON.stringify(payload);
  const stdout = execFileSync(PY, [pyScript, arg], {
    input,
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 500,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  return JSON.parse(stdout.trim());
}

// Prevede više listova u JEDNOM pozivu (model se učitava jednom).
// lists: { name: string[] }. Vraća { name: string[] }.
function translateAll(script, arg, lists, batchSize) {
  return runPython(script, arg, { keys: Object.keys(lists), lists, batch_size: batchSize });
}

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  let requested = Object.keys(BACKENDS);
  const langIdx = args.indexOf("--languages");
  if (langIdx >= 0) {
    const inline = (args[langIdx + 1] || "").split("=");
    requested = (inline.length > 1 ? inline[1] : inline[0]).split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const eq = args.find((a) => a.startsWith("--languages="));
    if (eq) requested = eq.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  const languages = requested.filter((l) => BACKENDS[l]);
  if (languages.length === 0) {
    console.error("No supported languages. Supported:", Object.keys(BACKENDS).join(","));
    process.exit(1);
  }
  if (!fs.existsSync(PY)) {
    console.error("Python not found at:", PY, "\nSet MEALMATE_PYTHON or create the venv.");
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(SRC_RECIPES, "utf-8"));
  const map = JSON.parse(fs.readFileSync(SRC_MAP, "utf-8"));
  const recipes = db.recipes || db;

  // Svi jedinstveni sastojci (iz kanonske mape — determinističko).
  const ingredientKeys = Object.keys(map).sort();

  // Skupovi za batch prevod
  const recipeNames = recipes.map((r) => r.name);
  const instructionsFlat = [];
  const instrIndex = []; // mapira flat index -> {recipeIdx, stepIdx}
  recipes.forEach((r, ri) => {
    (r.instructions || []).forEach((_, si) => {
      instrIndex.push([ri, si]);
      instructionsFlat.push(r.instructions[si]);
    });
  });

  for (const lang of languages) {
    const { script, arg } = BACKENDS[lang];
    console.log(`\n=== Translating: ${lang} (${script}) ===`);

    if (dry) {
      // simulacija: prefix svakog stringa
      const ingTrans = ingredientKeys.map((k) => `[${lang}] ${k}`);
      const namesTrans = recipeNames.map((n) => `[${lang}] ${n}`);
      const instrTrans = instructionsFlat.map((s) => `[${lang}] ${s}`);

      const ingredients = {};
      ingredientKeys.forEach((k, i) => {
        const tr = (ingTrans[i] || "").trim();
        ingredients[k] = tr && tr !== k ? tr : undefined;
      });

      const recipesOut = {};
      const instrMap = new Map(instrIndex.map(([rri, ssi], fi) => [`${rri}:${ssi}`, instrTrans[fi]]));
      recipes.forEach((r, ri) => {
        const name = (namesTrans[ri] || "").trim();
        const originalSteps = r.instructions || [];
        const steps = originalSteps.map((orig, si) => {
          const tr = (instrMap.get(`${ri}:${si}`) || "").trim();
          return tr && tr !== orig ? tr : orig;
        });
        const entry = {};
        if (name && name !== r.name) entry.name = name;
        if (steps.some((s, si) => s !== originalSteps[si])) entry.instructions = steps;
        recipesOut[r.id] = entry;
      });

      writeOut(lang, { ingredients, recipes: recipesOut });
      continue;
    }

    // Faza 1: sastojci + imena (brzo). Učitavamo model jednom.
    console.log(`  phase1: ingredients ${ingredientKeys.length} + names ${recipeNames.length}`);
    const out1 = translateAll(script, arg, {
      ingredients: ingredientKeys,
      names: recipeNames,
    }, 10);

    const ingredients = {};
    ingredientKeys.forEach((k, i) => {
      const tr = (out1.ingredients[i] || "").trim();
      ingredients[k] = tr && tr !== k ? tr : undefined;
    });

    // Checkpoint: sačuvaj sastojke+imena ODMAH (da se ne izgube ako padne).
    writeCheckpoint(lang, { ingredients, recipesPartial: {} });
    console.log(`  checkpoint saved: ingredients done for ${lang}`);

    // Faza 2: instrukcije (duge — mali batch da ne zaglavi).
    console.log(`  phase2: instructions ${instructionsFlat.length}`);
    const out2 = translateAll(script, arg, {
      instructions: instructionsFlat,
    }, 3);

    const recipesOut = {};
    const instrMap = new Map(instrIndex.map(([rri, ssi], fi) => [`${rri}:${ssi}`, out2.instructions[fi]]));
    recipes.forEach((r, ri) => {
      const name = (out1.names[ri] || "").trim();
      const originalSteps = r.instructions || [];
      const steps = originalSteps.map((orig, si) => {
        const tr = (instrMap.get(`${ri}:${si}`) || "").trim();
        return tr && tr !== orig ? tr : orig;
      });
      const entry = {};
      if (name && name !== r.name) entry.name = name;
      if (steps.some((s, si) => s !== originalSteps[si])) entry.instructions = steps;
      recipesOut[r.id] = entry;
    });

    writeOut(lang, { ingredients, recipes: recipesOut });
  }
  console.log("\nDone.");
}

function writeCheckpoint(lang, result) {
  const outPath = path.join(OUT_DIR, `${lang}.checkpoint.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
}

function writeOut(lang, result) {
  const outPath = path.join(OUT_DIR, `${lang}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(MOBILE_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
  fs.writeFileSync(path.join(MOBILE_DIR, `${lang}.json`), JSON.stringify(result), "utf-8");
  console.log(`  wrote: ${outPath}`);
}

main();
