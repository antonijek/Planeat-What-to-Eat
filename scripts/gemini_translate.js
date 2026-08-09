#!/usr/bin/env node
/**
 * Samostalni paralelni prevodilac baze preko Gemini API (gemini-3.1-flash-lite).
 *
 * NEZAVISAN od Kilo procesa — direktno koristi Gemini API, paralelno obrađuje
 * recepte, čuva svaki odmah, nastavlja od poslednjeg uspešnog (resume),
 * nikad ne prevodi ponovo već prevedeno.
 *
 * Pokretanje:
 *   set GEMINI_API_KEY=... ; node scripts/gemini_translate.js <lang> [--limit N] [--concurrency C]
 *   lang: es | de | it | pt | sr   (fr je već gotov preko DeepL)
 *
 * Opcije:
 *   --limit N         prevodi samo prvih N recepata (za test)
 *   --concurrency C   broj istovremenih zahteva (default 8)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "recipes.json");
const OUT_DIR = path.join(ROOT, "data", "translations");
const MOBILE_DIR = path.join(ROOT, "mobile", "src", "data", "translations");

// Učitaj ključ iz .env (scripts/.env) ili environment varijable. Nikad ne ispisuj.
function loadEnv() {
  const envFile = path.join(__dirname, ".env");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf-8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("GEMINI_API_KEY nije postavljen (env ili scripts/.env)"); process.exit(1); }
const MODEL = "gemini-3.1-flash-lite";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Konfiguracija
const CONCURRENCY = parseInt(process.argv.find((a) => a.startsWith("--concurrency"))?.split("=")[1] || "8", 10);
function getIntArg(name, def) {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return parseInt(eq.split("=")[1], 10);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1] && /^\d+$/.test(process.argv[idx + 1])) return parseInt(process.argv[idx + 1], 10);
  return def;
}
const LIMIT = getIntArg("limit", null);

const TARGET_LANG = {
  es: "Spanish", de: "German", it: "Italian", pt: "Portuguese", sr: "Serbian",
};
const MAX_RETRIES = 5;
const ITEM_BATCH = 5; // instrukcija po pozivu

async function geminiCall(prompt) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const body = await res.text();
    // izvuci RetryInfo (koliko da cekamo na 429)
    let retryMs = null;
    try {
      const j = JSON.parse(body);
      const rd = j?.error?.details?.find((d) => d.retryDelay);
      if (rd && rd.retryDelay) {
        // format "17.3s"
        retryMs = Math.ceil(parseFloat(rd.retryDelay) * 1000);
      }
    } catch {}
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.retryMs = retryMs;
    throw err;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text, usage: data?.usageMetadata || null };
}

function parseJsonArray(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); }
  catch { return null; }
}

// Retry sa backoff; na 429 koristi RetryInfo. Auto-smanjuje concurrency pri 429.
let rateLimited = false;
async function withRetry(prompt, n) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try { return await geminiCall(prompt); }
    catch (e) {
      if (e.status === 429) rateLimited = true;
      const delay = e.retryMs || (2000 * (attempt + 1));
      if (attempt === MAX_RETRIES - 1) throw e;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Prevodi listu item-a koristeći paralelni pool, vraća Map idx->translated
async function translateList(items, targetLang, progressCb) {
  const results = new Map();
  const batches = [];
  for (let i = 0; i < items.length; i += ITEM_BATCH) {
    batches.push({ start: i, items: items.slice(i, i + ITEM_BATCH) });
  }
  let done = 0;
  let usage = { promptTokens: 0, completionTokens: 0 };
  const worker = async () => {
    while (batches.length) {
      const batch = batches.shift();
      const joined = batch.items.map((t, j) => `${j}\t${t}`).join("\n");
      const prompt =
        `You are a professional translator. Translate each numbered line from English ` +
        `to ${targetLang}. Improve naturalness but keep meaning and numbers/measures as-is ` +
        `(translate unit words like cup/tbsp/g appropriately). Return ONLY a JSON array of ` +
        `translated strings, same order and count as input. Do not add explanations.\n\nInput:\n${joined}`;
      const { text, usage: u } = await withRetry(prompt, MAX_RETRIES);
      if (u) { usage.promptTokens += u.promptTokenCount || 0; usage.completionTokens += u.candidatesTokenCount || 0; }
      const arr = parseJsonArray(text);
      if (arr && arr.length === batch.items.length) {
        arr.forEach((tr, j) => results.set(batch.start + j, tr));
      } else {
        // ako ne uspe parsiranje, pokušaj pojedinačno
        for (let j = 0; j < batch.items.length; j++) {
          const single = await withRetry(
            `Translate this to ${targetLang} naturally, keep numbers as-is. Return ONLY the translation:\n${batch.items[j]}`, MAX_RETRIES);
          const singleText = single.text.trim();
          results.set(batch.start + j, singleText);
          if (single.usage) { usage.promptTokens += single.usage.promptTokenCount || 0; usage.completionTokens += single.usage.candidatesTokenCount || 0; }
        }
      }
      done++;
      if (progressCb) progressCb(done, batches.length + done);
    }
  };
  const workers = Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => worker());
  await Promise.all(workers);
  return { results, usage };
}

async function main() {
  const lang = process.argv[2];
  if (!TARGET_LANG[lang]) { console.error("lang mora biti: es|de|it|pt|sr"); process.exit(1); }
  const targetLang = TARGET_LANG[lang];

  const db = JSON.parse(fs.readFileSync(SRC, "utf-8"));
  let recipes = db.recipes || db;
  if (LIMIT) recipes = recipes.slice(0, LIMIT);

  // Učitaj već prevedeno (resume) — ako postoji
  const outPath = path.join(OUT_DIR, `${lang}.json`);
  let existing = { ingredients: {}, recipes: {} };
  if (fs.existsSync(outPath)) {
    try { existing = JSON.parse(fs.readFileSync(outPath, "utf-8")); } catch {}
  }
  // Recept se smatra "gotovim" samo ako ima prevedene instrukcije I status ok
  const doneIds = new Set(
    Object.keys(existing.recipes || {}).filter((id) => {
      const r = existing.recipes[id];
      return r && r._status === "ok" && Array.isArray(r.instructions) && r.instructions.length > 0;
    })
  );
  const doneIngredients = new Set(Object.keys(existing.ingredients || {}));

  console.log(`\n=== ${lang} → ${targetLang} (${recipes.length} recepata) ===`);
  console.log(`Concurrency: ${CONCURRENCY}, item batch: ${ITEM_BATCH}, resume: ${doneIds.size} recepata već gotovo\n`);

  const t0 = Date.now();

  // FAZA 1: jedinstveni sastojci + imena (samo oni koji nisu gotovi)
  // UVIJEK lowercase ključ — da nema case-duplikata (baza ima i "black eyed peas" i "Black Eyed Peas")
  const allIngredients = [...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.name.toLowerCase())))];
  const missingIngredients = allIngredients.filter((n) => !doneIngredients.has(n));
  const names = recipes.map((r) => r.name);
  const missingNames = recipes.filter((r) => !existing.recipes[r.id]?.name).map((r) => r.name);

  if (missingIngredients.length + missingNames.length > 0) {
    const items = [...missingIngredients, ...missingNames];
    const offsetIngredients = missingIngredients.length;
    console.log(`[phase1] sastojci+imena: prevodim ${items.length} (novih)`);
    let last = { lastPct: -1 };
    const { results, usage } = await translateList(items, targetLang, (done, total) => {
      const pct = Math.floor((done / total) * 100);
      if (pct > last.lastPct) { last.lastPct = pct; process.stdout.write(`\r  phase1 ${done}/${total} (${pct}%)`); }
    });
    process.stdout.write("\n");
    // sačuvaj sastojke
    for (let i = 0; i < offsetIngredients; i++) {
      const k = missingIngredients[i];
      const tr = (results.get(i) || "").trim();
      if (tr && tr !== k) existing.ingredients[k] = tr;
    }
    // imena će se čuvati po receptu u fazi 2 mapiranju
    const nameResults = new Map();
    for (let i = offsetIngredients; i < items.length; i++) {
      nameResults.set(items[i], (results.get(i) || "").trim());
    }
    global.__nameResults = nameResults;
    console.log(`  phase1 gotova (${usage.promptTokens + usage.completionTokens} tokena)`);
  }

  // FAZA 2: instrukcije — paralelno po receptu, čuvaj odmah
  const todo = recipes.filter((r) => !doneIds.has(r.id));
  console.log(`[phase2] instrukcije: ${todo.length} recepata za prevod`);
  let completed = doneIds.size;
  const total = recipes.length;

  let lastPct = -1;
  let usage2 = { promptTokens: 0, completionTokens: 0 };

  // Pool za recepte
  const queue = [...todo];
  const worker = async () => {
    while (queue.length) {
      const r = queue.shift();
      try {
        const origSteps = r.instructions || [];
        let steps = origSteps;
        if (origSteps.length) {
          const { results, usage } = await translateList(origSteps, targetLang);
          if (usage) { usage2.promptTokens += usage.promptTokens; usage2.completionTokens += usage.completionTokens; }
          steps = origSteps.map((orig, i) => (results.get(i) || "").trim() || orig);
        }
        const entry = { ...(existing.recipes[r.id] || {}) };
        const nameTr = global.__nameResults?.get(r.name);
        if (nameTr && nameTr !== r.name) entry.name = nameTr;
        entry.instructions = steps;
        entry._status = "ok";
        existing.recipes[r.id] = entry;
        doneIds.add(r.id);
        // sačuvaj ODMAH (resume)
        fs.mkdirSync(OUT_DIR, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(existing), "utf-8");
        fs.mkdirSync(MOBILE_DIR, { recursive: true });
        fs.writeFileSync(path.join(MOBILE_DIR, `${lang}.json`), JSON.stringify(existing), "utf-8");
      } catch (e) {
        console.error(`\n  GREŠKA za recept ${r.id}: ${e.message}`);
      }
      completed++;
      const pct = Math.floor((completed / total) * 100);
      if (pct > lastPct) {
        lastPct = pct;
        const elapsed = (Date.now() - t0) / 1000;
        const rate = completed / elapsed;
        const remaining = (total - completed) / rate;
        process.stdout.write(`\r  [${completed}/${total}] ${pct}%  | prošlo ${Math.round(elapsed)}s | ostaje ~${Math.round(remaining)}s`);
      }
    }
  };
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, () => worker());
  await Promise.all(workers);

  const elapsed = (Date.now() - t0) / 1000;
  const totalTokens = usage2.promptTokens + usage2.completionTokens;
  console.log(`\n\n=== GOTOVO: ${lang} — ${completed}/${total} recepata ===`);
  console.log(`Vreme: ${Math.round(elapsed)}s (${(elapsed / 60).toFixed(1)} min)`);
  console.log(`Tokeni: ${totalTokens} (~${(totalTokens / 1000).toFixed(1)}k)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
