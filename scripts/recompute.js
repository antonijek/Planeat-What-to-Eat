/**
 * Samo PRERAČUNAVA makroe iz postojećeg keša (data/nutrition_cache.json)
 * u data/recipes.json. Ne poziva USDA API.
 *
 * Pokreni nakon što je keš popunjen (enrich_nutrition.js).
 */

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.resolve(__dirname, "../data/recipes.json");
// Kanonska mapa: sastojak -> fdcId + per100 (zaključano, provereno).
// Ovo je DETERMINISTIČKI izvor — nema USDA pretrage, nema grešaka izbora.
const MAP_PATH = path.resolve(__dirname, "../data/ingredient_map.json");

const cache = JSON.parse(fs.readFileSync(MAP_PATH, "utf-8"));

const UNIT_GRAMS = {
  g: 1, gr: 1, gram: 1, grams: 1, kg: 1000,
  ml: 1, l: 1000,
  milliliter: 1, milliliters: 1, litre: 1000, litres: 1000,
  lb: 453.6, lbs: 453.6, pound: 453.6, pounds: 453.6,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  tbsp: 15, tbs: 15, tbls: 15, tablespoon: 15, tablespoons: 15, tblsp: 15,
  cup: 240, cups: 240,
  pinch: 0.3, handful: 30, handfull: 30, handfuls: 30, packet: 5, sachet: 5,
  dash: 0.5, splash: 10, bunch: 60, knob: 15, sprig: 3, sprigs: 3,
  bag: 250, jar: 300, tubs: 250, tub: 250, piece: 25, pieces: 25,
  slice: 20, slices: 20, fillet: 150, fillets: 150,
  clove: 3, cloves: 3,
  rasher: 25, rashers: 25,
  can: 400, cans: 400, tin: 400, tins: 400,
  head: 350, heads: 350, bulb: 250, quart: 950, quarts: 950, pint: 470,
  bottle: 750, package: 200, pot: 400, drop: 0.05, drops: 0.05,
  stick: 3, sticks: 3, leaf: 1, leaves: 10, floret: 15, florets: 15,
  strip: 2, strips: 2, shot: 30, shots: 30, scoop: 60,
  inch: 15, cm: 10, thumb: 15,
};

/**
 * Gramaža "1 cup" po namirnici — KLJUČNA tablica za tačnost.
 * "1 cup" NIJE isto za sve: brašno 125g, šećer 200g, mleko 244g, ulje 224g.
 * Vrednosti su realne (USDA / standardne kulinarske mere).
 * Ključevi se porede kao podstring imena sastojka.
 */
const CUP_DENSITY = [
  // brašna (najlakša — kritično!)
  { keys: ["flour", "plain", "self-raising", "self raising", "all purpose", "all-purpose", "bread flour", "cornflour", "cornstarch", "semolina", "wheat flour", "rye flour", "spelt"], grams: 125 },
  { keys: ["icing sugar", "powdered sugar", "confectioners"], grams: 120 },
  { keys: ["caster sugar", "granulated sugar", "sugar"], grams: 200 },
  { keys: ["brown sugar", "muscovado", "demerara", "palm sugar"], grams: 220 },
  // pirinač i žitarice
  { keys: ["rice", "risotto", "couscous", "quinoa", "bulgur"], grams: 185 },
  { keys: ["oats", "oatmeal", "porridge", "granola", "muesli"], grams: 85 },
  { keys: ["breadcrumbs", "panko"], grams: 110 },
  // tečnosti (gustina ~1)
  { keys: ["milk", "cream", "yogurt", "yoghurt", "buttermilk"], grams: 245 },
  { keys: ["water", "stock", "broth", "wine", "beer", "juice", "sake", "mirin"], grams: 240 },
  { keys: ["honey", "syrup", "treacle", "molasses", "golden syrup", "maple"], grams: 340 },
  // ulja (1 cup ~224g)
  { keys: ["oil"], grams: 224 },
  // maslac i masti
  { keys: ["butter", "margarine", "shortening", "lard", "suet", "ghee"], grams: 227 },
  // suvo (teško)
  { keys: ["chocolate chips", "chocolate"], grams: 170 },
  { keys: ["cocoa", "cacao"], grams: 100 },
  { keys: ["peanut butter", "nut butter"], grams: 258 },
  { keys: ["almonds", "nuts", "cashew", "pecan", "walnut", "pistachio", "hazelnut", "hazlenut"], grams: 150 },
  { keys: ["raisins", "sultanas", "currants", "dried fruit", "cranberries", "cherries", "dates"], grams: 150 },
  { keys: ["coconut", "desiccated"], grams: 85 },
  { keys: ["lentils", "beans", "peas", "chickpeas", "legumes", "toor", "dal"], grams: 200 },
  { keys: ["cheese", "cheddar", "parmesan", "mozzarella", "feta", "gouda"], grams: 110 },
  { keys: ["sugar snap", "green beans"], grams: 100 },
  // dodatne (retke ali bitne)
  { keys: ["tahini", "hummus"], grams: 260 },
  { keys: ["coconut flour", "cassava flour", "almond flour", "chickpea flour", "gram flour", "rice flour", "potato starch", "tapioca", "tempura flour", "buckwheat flour"], grams: 120 },
  { keys: ["tomato paste", "tomato puree", "passata", "tomato ketchup", "tomato sauce"], grams: 250 },
  { keys: ["mayonnaise", "aioli", "ranch"], grams: 230 },
  { keys: ["sour cream", "crème fraîche", "creme fraiche", "clotted cream", "fromage frais"], grams: 240 },
  { keys: ["salsa", "guacamole", "chutney", "relish"], grams: 250 },
  { keys: ["jam", "jelly", "marmalade", "curd", "lemon curd"], grams: 320 },
  { keys: ["cocoa butter", "white chocolate", "milk chocolate", "dark chocolate"], grams: 170 },
  { keys: ["peanut", "peanuts"], grams: 146 },
  { keys: ["sesame seed", "sesame seeds", "poppy seed", "poppy seeds", "chia", "flax"], grams: 150 },
  { keys: ["yeast", "baking powder", "baking soda", "bicarbonate", "cream of tartar", "gelatin", "gelatine"], grams: 125 },
  { keys: ["cornmeal", "polenta", "grits", "cornmeal"], grams: 130 },
  { keys: ["couscous"], grams: 180 },
  { keys: ["marshmallow", "marshmallows"], grams: 50 },
  { keys: ["ice cream", "gelato", "sorbet"], grams: 135 },
  { keys: ["coconut milk", "coconut cream"], grams: 240 },
  { keys: ["tofu", "tempeh", "paneer"], grams: 230 },
  { keys: ["soy sauce", "fish sauce", "oyster sauce", "hoisin", "teriyaki", "worcestershire"], grams: 250 },
  { keys: ["curry paste", "curry powder", "garam masala", "masala", "seasoning", "spice", "paprika", "turmeric", "cumin", "coriander", "cinnamon", "oregano", "thyme", "basil", "parsley", "dill", "chilli flakes", "chili", "peppercorns", "pepper", "salt", "mustard"], grams: 100 },
  { keys: ["fruit", "berries", "strawberries", "blueberries", "raspberries", "blackberries", "cherries"], grams: 150 },
  { keys: ["apple sauce", "applesauce"], grams: 250 },
  { keys: ["vegetable oil", "canola oil", "sunflower oil", "peanut oil", "olive oil", "coconut oil", "rapeseed", "sesame oil", "truffle oil"], grams: 224 },
];

const PIECE_GRAMS = {
  egg: 50, eggs: 50, "egg white": 30, "egg whites": 30, "egg yolk": 17, "egg yolks": 17,
  chicken: 120, "chicken breast": 150, "chicken breasts": 150, "chicken thigh": 130, "chicken thighs": 130,
  "chicken leg": 150, "chicken legs": 150, "chicken wing": 90, "chicken wings": 90,
  onion: 110, onions: 110, "red onion": 110, "red onions": 110, "spring onion": 20, "spring onions": 20,
  "green onion": 20, scallions: 20, shallot: 40, shallots: 40, challots: 40,
  tomato: 120, tomatoes: 120, "plum tomato": 90, "plum tomatoes": 90, "cherry tomato": 15, "cherry tomatoes": 15,
  "red pepper": 80, "green pepper": 80, "yellow pepper": 80, "bell pepper": 120, pepper: 80,
  potato: 150, potatoes: 150, carrot: 70, carrots: 70, celery: 40, cucumber: 250,
  "scotch bonnet": 12, "green chilli": 10, "red chilli": 10, "chilli": 10, "chillies": 10,
  lime: 65, lemons: 120, lemon: 120, "vanilla pod": 2, avocado: 150, apples: 150, apple: 150,
  beetroot: 120, "pita bread": 100, "bread roll": 60, "bread rolls": 60, "stock cube": 10,
  "vegetable stock cube": 10, "chicken stock cube": 10, "beef stock cube": 10,
  "cinnamon stick": 4, clove: 3, cloves: 3, "cardamom": 1, "star anise": 1,
  garlic: 3, "garlic clove": 3, "garlic cloves": 3,
  sausage: 75, sausages: 75, chorizo: 100, bacon: 15, "bacon rasher": 25, "bacon rashers": 25,
  "bay leaf": 1, "bay leaves": 1, jalapeno: 30, apricot: 35, apricots: 35, mint: 2,
  "meringue nest": 25, "meringue nests": 25, "star anise": 1, "star anises": 1, cardamom: 1,
  "cinnamon stick": 4, "cinnamon sticks": 4, "vanilla pod": 2,
  broccoli: 300, cauliflower: 500, corn: 200, "corn cob": 180, sweetcorn: 120,
  peach: 150, peaches: 150, pear: 150, pears: 150, orange: 130, oranges: 130, mango: 200,
  pineapple: 900, "pineapple ring": 50, fig: 50, figs: 50, date: 8, dates: 8, prune: 8, prunes: 8,
  grapefruit: 250, pomegranate: 280, kiwi: 75, "passion fruit": 35, "star fruit": 120,
  "bell peppers": 120, "green peppers": 80, "red peppers": 80, "yellow peppers": 80,
  "courgette": 180, "courgettes": 180, zucchini: 180, aubergine: 200, eggplant: 200,
  squash: 400, "butternut squash": 600, pumpkin: 500, cabbage: 900, lettuce: 300,
  "bok choi": 150, "pak choi": 150, leek: 150, leeks: 150, fennel: 300, "fennel bulb": 300,
  "sweet potato": 150, "sweet potatoes": 150, beetroot: 120, "green bean": 5, "green beans": 5,
  peas: 80, "broad beans": 100, "sugar snap peas": 50, asparagus: 15, "asparagus spear": 15,
  radish: 5, "daikon": 300, turnip: 100, turnips: 100, parsnip: 150, parsnips: 150,
  "green chilli": 10, "red chilli": 10, "scotch bonnet": 12, "habanero": 12, "birds-eye chilli": 5,
  "plum": 40, "plums": 40, grape: 5, grapes: 5, strawberry: 15, strawberries: 15,
  blueberry: 2, blueberries: 2, raspberry: 5, raspberries: 5, blackberry: 5, blackberries: 5,
  cranberry: 2, cranberries: 2, cherry: 8, cherries: 8, banana: 120, "banana leaf": 50,
  // morski plodovi i komadi mesa (često "samo broj")
  prawn: 15, prawns: 15, "king prawn": 30, "king prawns": 30, "tiger prawn": 40, "tiger prawns": 40,
  shrimp: 15, shrimps: 15, "jumbo shrimp": 30, lobster: 400, lobsters: 400, oyster: 20, oysters: 20,
  mussel: 15, mussels: 15, clam: 20, clams: 20, squid: 150, scallop: 20, scallops: 20,
  salmon: 180, "smoked salmon": 25, trout: 180, cod: 150, haddock: 150, tuna: 150, mackerel: 200, herring: 150, sardine: 15, sardines: 15, anchovy: 5, anchovies: 5,
  "pork chop": 200, "pork chops": 200, "pork belly": 200, "pork shoulder": 1500, "pork knuckle": 1000,
  "lamb leg": 2000, "lamb shoulder": 2500, "lamb loin chop": 150, "lamb loin chops": 150,
  "lamb chop": 120, "lamb chops": 120, "sirloin steak": 250, "beef brisket": 3000, "beef flank": 800,
  "duck leg": 250, "duck legs": 250, "duck breast": 200, "goose": 3000, "turkey": 5000,
  mushroom: 20, mushrooms: 20, "chestnut mushroom": 20, "shiitake": 15, "oyster mushroom": 15, "wild mushroom": 20,
  plantain: 300, breadfruit: 500,   "pita": 100, baguette: 250, "filo pastry": 100, "phyllo": 100, bread: 30, "bread slice": 30,
  "pork": 200, "beef": 200, "lamb": 200, "veal": 200, "chicken": 120,
};

function parseMeasure(measure) {
  if (!measure || measure === "porcija") return null;
  let s = String(measure).toLowerCase().trim();
  s = s
    .replace(/\u00BC/g, " 0.25 ")
    .replace(/\u00BD/g, " 0.5 ")
    .replace(/\u00BE/g, " 0.75 ")
    .replace(/\u2153/g, " 0.33 ")
    .replace(/\u2154/g, " 0.66 ");
  // opseg "2-3 tbsp" ili "2-1/2 cups" -> srednja vrednost
  const range = s.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\s*\/\s*\d+)?)/);
  if (range) {
    const a = evalFrac(range[1]);
    const b = evalFrac(range[2]);
    if (a > 0 && b > 0) {
      const mid = (a + b) / 2;
      const rest = s.replace(range[0], String(mid)).trim();
      return parseMeasure(rest);
    }
  }
  // "2 x 400g" ili "2 x 400g tins" -> mnozenje
  const times = s.match(/^(\d+)\s*x\s*(\d+)\s*(g|ml|kg|oz|lb)/);
  if (times) {
    const qty = parseInt(times[1], 10) * parseInt(times[2], 10);
    return { qty, unit: times[3] };
  }
  // bracket forma: "1 (12 oz.)" ili "1 (400g)"
  const bracket = s.match(/\(\s*([\d./\s]+)\s*([a-z]+)\s*\)/);
  if (bracket) {
    const qty = evalFrac(bracket[1]);
    const unit = bracket[2].replace(/\./g, "");
    if (qty > 0) return { qty, unit };
  }
  const match = s.match(/^([\d./\s]+)\s*([a-z]+)?/);
  if (!match || !match[1]) {
    // "juice of 1", "zest of 1" -> kolicina 1, bez jedinice
    const juice = s.match(/juice of\s+([\d./\s]+)/);
    if (juice) return { qty: evalFrac(juice[1]), unit: "juice" };
    // "Pinch", "Handful", "Dash", "Splash" bez broja -> kolicina 1
    const word = s.match(/^([a-z]+)/);
    if (word) {
      const unit = word[1];
      if (["pinch", "handful", "handfull", "dash", "splash", "packet", "sachet", "bunch", "knob", "sprig", "sprigs"].includes(unit)) {
        return { qty: 1, unit };
      }
    }
    return null;
  }
  return { qty: evalFrac(match[1]), unit: match[2] || null };
}

/** Procena broja porcija iz ukupnih kalorija (~550 kcal/porciji). */
/**
 * Procena broja porcija — uzima u obzir I kalorije I ukupnu gramažu.
 * Prosečan obrok ~450-550g hrane ili ~550 kcal.
 */
function estimateServings(kcal, totalGrams) {
  if (kcal <= 0) return null;
  const byCal = kcal / 550;
  const byWeight = totalGrams > 0 ? totalGrams / 450 : byCal;
  // teži ka većem broju (da ne potcenimo velike serije)
  const s = Math.round(Math.max(byCal, byWeight));
  return Math.min(20, Math.max(1, s));
}
function evalFrac(s) {
  let total = 0;
  for (const p of s.trim().split(/\s+/)) {
    if (!p) continue;
    if (p.includes("/")) {
      const [a, b] = p.split("/").map(Number);
      total += a / (b || 1);
    } else total += parseFloat(p) || 0;
  }
  return total;
}

/** Gramaža jedinice (cup/tbsp/tsp) uvažavajući gustinu namirnice. */
function gramsPerUnit(unit, name) {
  const base = UNIT_GRAMS[unit];
  // samo za cup/tbsp/tsp gledaj gustinu po namirnici
  const isCup = /^(cup|cups)$/.test(unit);
  const isTbsp = /^(tbsp|tbs|tbls|tablespoon|tablespoons|tblsp)$/.test(unit);
  const isTsp = /^(tsp|teaspoon|teaspoons)$/.test(unit);
  if (isCup || isTbsp || isTsp) {
    // prvo najduža ključna reč (da "brown sugar" pobedi nad "sugar")
    let best = null;
    let bestLen = -1;
    for (const r of CUP_DENSITY) {
      for (const k of r.keys) {
        if (name.includes(k) && k.length > bestLen) {
          bestLen = k.length;
          best = r;
        }
      }
    }
    if (best) {
      if (isCup) return best.grams;
      if (isTbsp) return best.grams / 16; // 16 tbsp u šolji
      return best.grams / 48; // 48 tsp u šolji
    }
  }
  return base;
}

function measureToGrams(ingredient, measure, usda) {
  const parsed = parseMeasure(measure);
  if (!parsed) return null;
  const { qty, unit } = parsed;
  const name = ingredient.toLowerCase();

  if (unit) {
    if (usda && usda.measures) {
      const unitKey = unit.endsWith("s") ? unit.slice(0, -1) : unit;
      const gram = usda.measures[unitKey] || usda.measures[unit];
      if (gram) return qty * gram;
    }
    const density = gramsPerUnit(unit, name);
    if (density) return qty * density;
    if (unit === "juice") {
      // "juice of 1 lime" -> ~30g soka
      return qty * 30;
    }
    // "2 chopped", "3 diced", "1 large" -> broj komada po namirnici
    if (["chopped", "diced", "sliced", "halved", "small", "medium", "large", "finely", "minced", "crushed", "grated", "shredded", "beaten", "steamed", "ground"].includes(unit)) {
      const pieceKey = Object.keys(PIECE_GRAMS).find((k) => name.includes(k));
      if (pieceKey) return qty * PIECE_GRAMS[pieceKey];
    }
  }
  // procena po komadu: "2" ili "1 chopped" -> po imenu namirnice
  const pieceKey = Object.keys(PIECE_GRAMS).find((k) => name.includes(k));
  if (pieceKey) return qty * PIECE_GRAMS[pieceKey];
  if (usda && usda.measures) {
    const whole = usda.measures["whole"] || usda.measures["Quantity not specified"];
    if (whole) return qty * whole;
  }
  return null;
}

const db = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
let filled = 0;

// Sastojci koji su SAMI dodati šećer — njihov ukupni šećer se računa kao "added sugar"
const ADDED_SUGAR = /sugar|honey|syrup|jam|jelly|marmalade|molasses|treacle|chocolate|cacao|caramel|fudge|toffee|condensed milk|golden syrup|maple|glucose|fructose|sweetened/i;
// "Čisti šećer" — sastojci koji su gotovo 100% šećer, pa je added sugar = carbs
const PURE_SUGAR = /sugar|honey|syrup|jam|jelly|marmalade|molasses|treacle|golden syrup|maple|glucose|fructose/i;

for (const r of db.recipes) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0, fiber = 0, sugar = 0, sodium = 0, chole = 0, sat = 0, addedSugar = 0;
  const newIngredients = [];
  for (const ing of r.ingredients) {
    const usda = cache[ing.name.trim().toLowerCase()];
    const grams = measureToGrams(ing.name, ing.measure, usda);
    newIngredients.push({ ...ing, grams: grams != null ? Math.round(grams) : null });
    if (!usda || !usda.per100 || grams == null) continue;
    const p100 = usda.per100;
    // kJ→kcal: USDA ponekad daje Energy u kJ (1220 kJ = 291 kcal).
    // Ulja/masti su jedina hrana sa kcal>700/100g, pa ih izuzimamo po imenu.
    // NAPOMENA: ne koristi 4-4-9 poređenje — ono lažno trigira za začíne/alkohol
    // (vlakna i alkohol imaju kcal koje 4-4-9 ne računa, npr. cimet 249 je tačno).
    let kcal100 = p100.kcal;
    const isFat = /oil|butter|lard|shortening|ghee|suet|margarine|goose fat|tallow/i.test(ing.name);
    if (kcal100 > 700 && !isFat) kcal100 = kcal100 / 4.184;
    kcal += (kcal100 * grams) / 100;
    protein += (p100.protein * grams) / 100;
    fat += (p100.fat * grams) / 100;
    carbs += (p100.carbs * grams) / 100;
    fiber += (p100.fiber * grams) / 100;
    sugar += (p100.sugars * grams) / 100;
    sodium += (p100.sodium * grams) / 100;
    chole += (p100.cholesterol * grams) / 100;
    sat += (p100.satFat * grams) / 100;
    // Dodati šećer: za "čisti šećer" (sugar/honey/syrup) added = carbs (jer je sve šećer);
    // za ostale slatke (čokolada...) koristi sugars ako postoji
    if (ADDED_SUGAR.test(ing.name)) {
      const sugarPortion = PURE_SUGAR.test(ing.name) ? p100.carbs : p100.sugars;
      addedSugar += (sugarPortion * grams) / 100;
    }
  }
  r.ingredients = newIngredients;
  if (kcal > 0) {
    r.calories = Math.round(kcal);
    r.protein = Math.round(protein);
    r.fats = Math.round(fat);
    r.carbs = Math.round(carbs);
    r.fiber = Math.round(fiber);
    r.sugars = Math.round(sugar);
    r.addedSugar = Math.round(addedSugar);
    r.sodium = Math.round(sodium);
    r.cholesterol = Math.round(chole);
    r.saturatedFat = Math.round(sat);
    const totalGrams = newIngredients.reduce((a, ing) => a + (ing.grams || 0), 0);
    r.servings = estimateServings(kcal, totalGrams);
    filled++;
  } else {
    delete r.servings;
  }
}
db.meta.nutritionUpdated = new Date().toISOString();
fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
console.log(`[OK] Popunjeno ${filled}/${db.recipes.length} recepata`);
