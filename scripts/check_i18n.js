/**
 * PROVERA PREVODA (i18n) — svi jezici moraju imati iste ključeve kao en (izvor).
 *
 * Kada se doda novi UI tekst, dodaj ključ u `src/i18n/en.ts`, pa pokreni:
 *   node scripts/check_i18n.js
 *
 * Ispisuje koji ključevi nedostaju po jeziku (i koji su višak). Vraća
 * exit code 1 ako ima problema (može se koristiti i u CI).
 *
 * Napomena: jezici override-uju CELE sekcije (npr. `home: { ... }`), pa
 * ključ dodan u `en` ne mora automatski postojati u ostalim — zato ovo i radimo.
 */

const fs = require("fs");
const path = require("path");

let ts;
try {
  ts = require(path.resolve(__dirname, "../mobile/node_modules/typescript"));
} catch {
  console.error("Nije nađen TypeScript u mobile/node_modules. Pokreni `cd mobile && npm install`.");
  process.exit(1);
}

const dir = path.resolve(__dirname, "../mobile/src/i18n");
const langs = ["en", "de", "es", "fr", "it", "pt", "sr"];

function transpile(code) {
  return ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
}

function load(name, enObj) {
  const code = fs.readFileSync(path.join(dir, name + ".ts"), "utf8");
  const js = transpile(code);
  const module = { exports: {} };
  const requireMock = (p) => {
    if (p === "./en") return { __esModule: true, default: enObj };
    throw new Error("Nepoznati require: " + p);
  };
  new Function("require", "module", "exports", js)(requireMock, module, module.exports);
  return module.exports.default || module.exports;
}

function flatten(o, prefix, out) {
  for (const k of Object.keys(o || {})) {
    const v = o[k];
    const p = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

function main() {
  let enObj = null;
  const objs = {};
  for (const l of langs) {
    objs[l] = load(l, enObj);
    if (l === "en") enObj = objs.en;
  }
  // ponovo učitaj ostale sada kad enObj postoji (de itd. importuju en)
  for (const l of langs) {
    if (l !== "en") objs[l] = load(l, enObj);
  }

  const enFlat = flatten(enObj, "", {});
  let hasIssues = false;

  console.log("Ukupno ključeva u en:", Object.keys(enFlat).length);
  for (const l of langs) {
    if (l === "en") continue;
    const flat = flatten(objs[l], "", {});
    const missing = Object.keys(enFlat).filter((k) => !(k in flat));
    const extra = Object.keys(flat).filter((k) => !(k in enFlat));

    console.log("\n===== " + l.toUpperCase() + " =====");
    console.log("  ključeva:", Object.keys(flat).length, "| nedostaje:", missing.length);

    if (missing.length) {
      hasIssues = true;
      missing.forEach((k) => console.log("    NEDOSTAJE: " + k + "  = " + JSON.stringify(enFlat[k])));
    }
    if (extra.length) {
      hasIssues = true;
      console.log("  VIŠAK (u jeziku, nema u en):", extra.join(", "));
    }
  }

  if (hasIssues) {
    console.log("\n✗ Ima nedostajućih ključeva — dodaj prevode.");
    process.exit(1);
  }
  console.log("\n✓ Svi jezici imaju sve ključeve.");
}

main();
