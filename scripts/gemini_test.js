#!/usr/bin/env node
/**
 * TEST: prevodi 10 recepata na 1 jezik i meri metrike.
 * Ne menja ništa trajno — samo meri vreme/tokene/cenu/pozive.
 *
 * Pokretanje:  node scripts/gemini_test.js <lang>
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "recipes.json");
const db = JSON.parse(fs.readFileSync(SRC, "utf-8"));
const recipes = db.recipes.slice(0, 10);

const TARGET_LANG = { es: "Spanish", de: "German", it: "Italian", pt: "Portuguese", sr: "Serbian" };
const lang = process.argv[2];
const targetLang = TARGET_LANG[lang];
if (!targetLang) { console.error("lang: es|de|it|pt|sr"); process.exit(1); }

// ---- import logike iz gemini_translate.js (delim: ključ, call, retry) ----
const fs2 = fs;
const path2 = path;
function loadEnv() {
  const envFile = path2.join(__dirname, ".env");
  if (fs2.existsSync(envFile)) for (const line of fs2.readFileSync(envFile, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-lite";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const MAX_RETRIES = 5;
const ITEM_BATCH = 5;

let apiCalls = 0;
async function geminiCall(prompt) {
  apiCalls++;
  const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) });
  if (!res.ok) { const b = await res.text(); throw new Error(`HTTP ${res.status}: ${b.slice(0,200)}`); }
  const data = await res.json();
  return { text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "", usage: data?.usageMetadata || null };
}
async function withRetry(prompt) {
  for (let a = 0; a < MAX_RETRIES; a++) { try { return await geminiCall(prompt); } catch (e) { await new Promise(r=>setTimeout(r,1500*(a+1))); } }
  throw new Error("retry iscrpljen");
}
function parseJsonArray(text) { const s=text.indexOf("["), e=text.lastIndexOf("]"); if(s===-1||e===-1||e<=s) return null; try{return JSON.parse(text.slice(s,e+1));}catch{return null;} }

async function translateList(items) {
  const results = new Map();
  const batches = [];
  for (let i=0;i<items.length;i+=ITEM_BATCH) batches.push({start:i, items:items.slice(i,i+ITEM_BATCH)});
  let usage = { p:0, c:0 };
  let done=0;
  const worker = async () => {
    while (batches.length) {
      const batch = batches.shift();
      const joined = batch.items.map((t,j)=>`${j}\t${t}`).join("\n");
      const prompt = `You are a professional translator. Translate each numbered line from English to ${targetLang}. Improve naturalness but keep meaning and numbers/measures as-is. Return ONLY a JSON array, same order/count. Do not add explanations.\n\nInput:\n${joined}`;
      const { text, usage:u } = await withRetry(prompt);
      if (u) { usage.p += u.promptTokenCount||0; usage.c += u.candidatesTokenCount||0; }
      const arr = parseJsonArray(text);
      if (arr && arr.length===batch.items.length) arr.forEach((tr,j)=>results.set(batch.start+j,tr));
      else for (let j=0;j<batch.items.length;j++){ const s=await withRetry(`Translate to ${targetLang}, only translation:\n${batch.items[j]}`); results.set(batch.start+j, s.text.trim()); }
      done++;
    }
  };
  await Promise.all(Array.from({length:3},()=>worker()));
  return { results, usage };
}

async function main() {
  // sastojci + imena + instrukcije za 10 recepata
  const allIngredients = [...new Set(recipes.flatMap(r=>r.ingredients.map(i=>i.name.toLowerCase())))];
  const names = recipes.map(r=>r.name);
  const instrFlat = recipes.flatMap(r=>r.instructions||[]);

  console.log(`\n=== TEST: ${recipes.length} recepata → ${targetLang} ===`);
  const t0=Date.now();
  const phase1 = await translateList([...allIngredients, ...names]);
  const t1=Date.now();
  const phase2 = await translateList(instrFlat);
  const t2=Date.now();

  const inputTokens = phase1.usage.p + phase2.usage.p;
  const outputTokens = phase1.usage.c + phase2.usage.c;
  const totalTokens = inputTokens + outputTokens;
  const elapsed = (t2-t0)/1000;
  // gemini-3.1-flash-lite cena (priblizno, USD): ~$0.10/1M input, ~$0.40/1M output
  const cost = (inputTokens/1e6*0.10) + (outputTokens/1e6*0.40);

  console.log(`Ukupno vreme: ${elapsed.toFixed(1)}s (${(elapsed/60).toFixed(1)} min)`);
  console.log(`Input tokeni: ${inputTokens}`);
  console.log(`Output tokeni: ${outputTokens}`);
  console.log(`Ukupno tokena: ${totalTokens}`);
  console.log(`API poziva: ${apiCalls}`);
  console.log(`Prosecno vreme/recept: ${(elapsed/recipes.length).toFixed(1)}s`);
  console.log(`Procenjena cena: \$${cost.toFixed(4)} (~${(cost*1.1).toFixed(4)} EUR)`);
  console.log(`Procena za 789 recepata: ~${(elapsed/recipes.length*789/60).toFixed(1)} min, ~\$${(cost*78.9).toFixed(2)}`);

  console.log("\n--- uzorak kvaliteta ---");
  const ingKeys = allIngredients.slice(0,4);
  for (let i=0;i<ingKeys.length;i++) console.log(`  ${ingKeys[i]} → ${phase1.results.get(i)}`);
  console.log(`  ${names[0]} → ${phase1.results.get(allIngredients.length)}`);
  if (phase2.results.size) console.log(`  instr: ${phase2.results.get(0)?.substring(0,80)}...`);
}
main();
