#!/usr/bin/env node
/**
 * Test prevoda: 10 recepata na 1 jezik (španski) da izmerimo trošak/vreme/kvalitet.
 * Ne menja ništa trajno — samo meri.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PY = process.env.MEALMATE_PYTHON;
const db = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "recipes.json"), "utf-8"));
const recipes = db.recipes.slice(0, 10);

// sastojci + imena + instrukcije za 10 recepata
const ingredientKeys = [...new Set(recipes.flatMap(r => r.ingredients.map(i => i.name)))];
const names = recipes.map(r => r.name);
const instructionsFlat = [];
const instrIndex = [];
recipes.forEach((r, ri) => {
  (r.instructions || []).forEach((s, si) => {
    instrIndex.push([ri, si]);
    instructionsFlat.push(s);
  });
});

const lang = "Spanish";

function run(script, batchSize, items) {
  const payload = { keys: ["x"], lists: { x: items }, batch_size: batchSize };
  const stdout = execFileSync(PY, [path.join(ROOT, ".venv", script), lang], {
    input: JSON.stringify(payload),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 100,
    env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY, PYTHONIOENCODING: "utf-8" },
  });
  return JSON.parse(stdout.trim()).x;
}

const t0 = Date.now();
console.log(`Test: ${recipes.length} recepata → ${lang}`);
console.log(`  sastojci+imena: ${ingredientKeys.length + names.length} elemenata`);
console.log(`  instrukcije: ${instructionsFlat.length} pasusa\n`);

const t1 = Date.now();
const ingNames = run("gemini_batch.py", 10, [...ingredientKeys, ...names]);
const t2 = Date.now();
console.log(`Faza 1 (sastojci+imena, batch 10): ${((t2-t1)/1000).toFixed(1)}s`);

const t3 = Date.now();
const instrs = run("gemini_batch.py", 3, instructionsFlat);
const t4 = Date.now();
console.log(`Faza 2 (instrukcije, batch 3): ${((t4-t3)/1000).toFixed(1)}s`);

console.log(`\nUKUPNO: ${((t4-t0)/1000).toFixed(1)}s za 10 recepata`);
console.log(`Procena za 789 recepata: ~${((t4-t0)/1000*78.9/60).toFixed(1)} min (1 jezik)`);

// uzorak kvaliteta
console.log("\n--- Uzorak kvaliteta ---");
ingredientKeys.slice(0, 3).forEach((en, i) => console.log(`  ${en} → ${ingNames[i]}`));
console.log(`  ${names[0]} → ${ingNames[ingredientKeys.length]}`);
if (instrs[0]) console.log(`  instr: ${instrs[0].substring(0, 80)}...`);
