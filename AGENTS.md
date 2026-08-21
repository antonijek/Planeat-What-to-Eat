# Planeat — Uputstvo za razvoj (AGENTS.md)

Ovo je dokument koji pomaže svakom AI agentu (i developeru) da nastavi rad na projektu
bez gubljenja konteksta. **Pročitaj ovo pre bilo kakve izmene.**

---

## Šta je aplikacija

**Planeat** ("Šta danas da jedem?") — React Native (Expo) mobilna aplikacija za
odlučivanje šta jesti, planiranje obroka i pravljenje liste za kupovinu.

### Branding / naziv (podsetnik — namera, NIJE još primenjeno u kod)
- Ime app: **Planeat** (naziv u `About` već je "Planeat — What to Eat"; stari naziv u AGENTS bio "MealMate AI").
- Namera za slogan (ispod logoa/splash, podnaslov na Home-u): **"Plan. Cook. Track."** — JOŠ NIJE postavljeno u `i18n/home.subtitle`.
- NAMERA za store listing: **"Planeat – Recipes, Meal Planner & Calories"** — JOŠ NIJE postavljeno u `app.json` (trenutno `name: "Planeat — What to Eat"`, `description` je opis točka).
- Kad se odluči: `app.json` → `name: "Planeat"`, `description` sadrži store listing, `slug: "planeat"`; `i18n/home.subtitle` → "Plan. Cook. Track." (slogan ostaje engleski kao brend).

- **Glavni ekran** je točak 🎡 koji korisnik vrti i dobija nasumičan recept.
- Točak je *ulazna tačka* (zabava), ali prava vrednost je rešavanje svakodnevnih problema:
  "Imam 20 min, šta da skuvam?", "Imam piletinu i krompir, šta mogu?", "Šta da kupim za celu nedelju?".
- **Monetizacija:** zaključane Premium funkcije (NEMA reklama). Free korisnik ima točak
  (5 vrtnji/dan) i osnovne funkcije. Premium (2.99€/mes, 49.99€ doživotno) otključava sve.

### ⚠️ TRENUTNO U RAZVOJU (VAŽNO ZA TESTIRANJE)
- **UI je CELO na engleskom** (ne srpski) — baza recepata je engleska pa je tako konzistentno.
  Višejezičnost se planira kasnije.
- **`premiumService.ts` ima `DEV_UNLOCK_ALL = true`** — sve je otključano za testiranje
  (neograničeno vrtnji, svi premium ekrani). Kada se završi razvoj → postavi na `false`.
- **Expo SDK 54** (ne 57!). Zbog toga:
  - `babel.config.js` NEMA ručni worklets plugin — `babel-preset-expo` ga dodaje sam.
    Ako se doda ručno → "worklets not ready" greška.
  - Koristi se `react-native-reanimated@4.1.7` + `react-native-worklets@0.5.1` (OBAVEZNO oba).
  - Expo Go sa telefona radi samo sa SDK 54.
- Ako se promeni SDK: pokreni `npx expo install --fix` da uskladi sve native verzije.

---

## Arhitektura (VAŽNO)

```
sta-danas-da-jedem/
├── data/recipes.json          ← glavna baza recepata (789 iz TheMealDB, povučeno skriptom)
├── scripts/fetch_themealdb.js ← jednokratna skripta za ažuriranje baze
└── mobile/                    ← Expo React Native app
    └── src/
        ├── screens/           ← ekrani (1 fajl = 1 ekran)
        ├── components/        ← deljene komponente (Wheel, RecipeCard, AppModal...)
        ├── services/          ← ⭐ logika / granica ka budućem backendu
        ├── store/             ← Zustand store-ovi (stanje u memoriji)
        ├── storage/           ← AsyncStorage helperi (trajni podaci)
        ├── types/             ← TypeScript tipovi (index.ts)
        ├── utils/             ← pomoćne funkcije bez stanja
        ├── constants/         ← theme.ts (boje), categories.ts
        ├── data/recipes.json  ← KOPIJA baze koja se bundle-uje u app
        └── navigation/        ← navigacija (tabs + stack)
```

## Slojevi i pravila zavisnosti

- **screens** → koristi `components`, `services`, `store`, `constants`, `types`
- **components** → koristi `services`, `constants`, `types` (NE screens)
- **services** → koristi `storage`, `types`
- **store** (Zustand) → koristi `services`, `storage`, `types`
- **storage** → koristi `types` samo
- **utils** → čiste funkcije, koristi `types`

**Pravilo:** nikad ne diraj `data/recipes.json` iz ekrana. Uvek idi kroz `services/`.

---

## ⭐ Sloj za budući backend

`services/` je **granica** između aplikacije i izvora podataka. Trenutno sve radi lokalno
(JSON + AsyncStorage), ali kad dođe **Laravel backend sa SQL bazom**, menja se SAMO
implementacija funkcija u `services/` — ekrani i store-ovi se ne diraju.

Ključni servisi:
- `recipeService` — čita recepte (sada iz bundle JSON-a; kasnije `GET /recipes`)
- `myRecipesService` — sopstveni recepti korisnika
- `overrideService` — korisničke IZMENE recepata ("vrati na original")
- `premiumService` — premium status + dnevna kvota vrtnji
- `historyService` — istorija vrtnji
- `planService` — planer obroka + generisanje liste za kupovinu

Kad uvodite backend: napravite `mobile/src/services/api.ts` (Axios klijent), a svaki servis
zadrži ISTI javni API (ista imena funkcija), samo promeni telo funkcija na API pozive.

---

## Model podataka (tipovi)

Sve u `types/index.ts`. Najvažniji:
- `Recipe` — id, name, category, area, prepTime, difficulty, calories/protein/carbs/fats,
  ingredients[], instructions[], imageUrl, source, dietaryTags[] + OPcIONO: fiber,
  sugars, sodium, cholesterol, saturatedFat, servings
- `Ingredient` — name, measure, amount, unit + opciono `grams` (iz USDA)
- `RecipeOverride` — izmene korisnika na receptu (original se NIKAD ne menja)
- `MealPlanEntry`, `ShoppingItem`, `HistoryEntry`, `Favorite`, `PremiumType`, `UserSettings`

### Bitno o kalorijama u app
- `Recipe.calories` = kcal za **CEO recept** (šerpu). App prikazuje **kcal PO PORCIJI**:
  `Math.round(recipe.calories / (recipe.servings || 1))` — u `RecipeCard`, `RecipeDetailScreen`, `StatsScreen`.
- `Recipe.servings` = procenjen broj porcija (~550 kcal/porciji ili ~450g hrane po porciji, uzima se veći).
- **Brojač osoba** u RecipeDetailScreen polazi od `recipe.servings` (NE od 2) — da količine ostanu
  originalne dok korisnik ne promeni. Recepti su za celu seriju (npr. 12 tartova), ne za 1 osobu.
- **Skaliranje sastojaka je ODNOS, ne množenje:** `faktor = persons / servings` (ne `× persons`!).
  U `utils/helpers.ts` — `scaleMeasure(measure, persons, servings)`, `formatAmount(ing, persons, servings)`.
  Bug: ranije "1 cup" × 12 osoba = "12 cups"; ispravno je 12/12 = 1 → "1 cup".
- **Nutricioni prikaz** (RecipeDetailScreen) — redosled kao na proizvodima:
  Energy → Fat (of which saturates) → Carbohydrate (of which sugars *(added)*) → Protein → Fiber.
  **"More values"** (expand): Salt, Cholesterol, Sodium. Ukupni šećer je UKLONJEN (USDA nema podatak za većinu).

### Važno o receptima
- Recepti iz baze imaju `id` koji nije "user-..." prefiks.
- **Sopstveni recepti korisnika imaju `id` koji počinje sa `user-`**.
- Kod koji prikazuje/snima recepte mora proveriti prefix da zna da li je sopstveni.

---

## Konvencije kodiranja (OBAVEZNO)

1. **Ne ponavljaj kod.** Ako vidiš da se nešto koristi na 2+ mesta → izvuci u
   komponentu/util i reuse. Primeri već urađeni:
   - `AppModal` — zajednički modal šablon (koriste ga AddRecipeModal i EditRecipeModal)
   - `PremiumLockScreen` — zajednički ekran za premium-zaključane funkcije
   - `utils/ingredients.ts` — parsiranje/formatiranje sastojaka
   - `utils/helpers.ts` — scaleIngredients (broj osoba), formatDuration
2. **Koristi `colors` konstante** iz `constants/theme.ts`. NIKADA hardkoduj hex boje
   kao `"#FFF7ED"` u fajlovima.
3. **1 komponenta = 1 fajl.** Fajl treba da bude kratak i fokusiran (< ~200 linija idealno).
   Ako naraste, razbij ga.
4. **TypeScript strict.** Uvek tipiziraj props, store, servise. Izbegavaj `any`.
5. **Named exports** za komponente i funkcije (ne default export).
6. **Ekrani ne drže logiku** — pozivaju servise. Servisi ne renderuju UI.
7. **Premium gating:** proveri `isPremium` iz `useUserStore`. Za locked ekrane koristi
   `PremiumLockScreen`. Ne prikazuj premium sadržaj free korisnicima.
8. **Količine sastojaka** se skaliraju brojem osoba kroz `scaleIngredients`.
9. Ne piši komentare osim ako nisu neophodni za objašnjenje (preferiraj samodokumentovan kod).

---

## Storiji (Zustand)

- `userStore` — premium, omiljeni, ocene (`loadUserData()` se zove na startu app)
- `recipeStore` — svi recepti (uključujući sopstvene), poslednji izbor točka
- `shoppingStore` — lista za kupovinu

Store-ovi čitaju/pisuju kroz servise → storage (AsyncStorage). Ne čuvaj duplikate logike.

---

## Navigacija

- **RootNavigator** (`navigation/RootNavigator.tsx`) — stack, koristi `RootStackParamList`
- **MainTabs** (`navigation/MainTabs.tsx`) — bottom tabs (Točak, Recepti, Omiljeni, Kupovina)
- Tipovi ruta su u `navigation/types.ts`. Kad dodaš ekran: dodaj rutu u tipove +
  registruj u RootNavigator.

**Trenutni stack ekrani:** Home, RecipeDetail, Premium, History, Stats, Planer, MyRecipes.
Access do History/Stats/Planer/MyRecipes je preko ikonica na HomeScreen-u (header).

### Točak (HomeScreen) — detalji dizajna
- **Meal-moment čipovi** ispod točka: `✨ All | 🍳 Breakfast | 🍽️ Lunch | 🌙 Dinner | 🍰 Dessert | 🍿 Snack`
  (definisano u `constants/mealMoments.ts`, komponenta `MealMomentPicker`). Filter sprečava
  točak da prikaže "beef" kad je izabran Breakfast.
- **Točak je čist spinner** (šareni segmenti + 12 univerzalnih emoji-ja), **bez imena jela**.
  Posle vrtnja otvara se **`WheelResultModal`** ("🎉 Your meal: ...") sa slikom i vremenom.
- **Emoji-ji se prikazuju IZVAN rotirajućeg točka** (pozicija prati rotaciju, ali emoji je
  uvek uspravan). NE stavljaj emoji u SVG text (`SvgText`) — na Androidu su naopako.
- **Pointer (branik):** krug (postolje) + beli trougao; rotira se samo postolje dok se vrti
  (pulsira pri prolasku eksera). NE koristi `transformOrigin` (baca "for input string").
- **Ekseri (nails)** na obodu — mali tamni krugovi (glave eksera), fiksni.
- **Zvuk točka:** `assets/sounds/tick.wav` (generisan WAV, ~40ms "tuk"), ponavlja se
  sinhronizovano sa prelaskom eksera preko pointera (`expo-audio`, `volume=1`).
- **`Wheel.tsx`** — vidi komentare u fajlu za detalje.

---

## Baza recepata — kako se ažurira

Baza živi u `data/recipes.json` (789 recepata). Skripte (REDOSLED je bitan!):
```
node scripts/fetch_themealdb.js    # povlači recepte iz TheMealDB (789)
node scripts/enrich_nutrition.js   # povlači USDA nutritivne podatke (ime ključa u USDA_API_KEY ili u fajlu)
node scripts/refine_nutrition.js   # ponovo povlači sumnjive sastojke preko data/query_map.json
node scripts/fix_values.js         # ručno popravlja stvarne vrednosne greške (kcal=0, kJ, pogrešni food)
node scripts/make_ingredient_map.js # generiše kanonsku mapu iz keša (deterministički izvor)
node scripts/recompute.js          # računa makroe iz ingredient_map.json (BEZ USDA pretrage)
node scripts/validate_db.js        # provera svih 946 sastojaka na poznate klase grešaka
```
Posle toga **kopiraj** ažuriran JSON u `mobile/src/data/recipes.json` (jer Metro bundle-uje
samo fajlove unutar projekta). Obe verzije drži sinhronizovane.

### Nutritivni podaci (status)
- **USDA FoodData Central** — keš u `data/nutrition_cache.json` (946 sastojaka, ~99% popunjeno, 11 egzotičnih bez podataka)
- **KANONSKA MAPA** `data/ingredient_map.json` (938 sastojaka) — **glavni izvor za recompute** (deterministički, bez USDA pretrage). Regeneriši sa `make_ingredient_map.js` nakon `fix_values.js`/`refine_nutrition.js`.
- **Precizni upiti** u `data/query_map.json` — mapa naziv→USDA query za problematične sastojke (koristi `refine_nutrition.js`). USDA search vraća pogrešne proizvode za generičke nazive ("milk"→coconut milk), pa je mapa ključna.
- **Makroi po receptu**: calories, protein, carbs, fats + fiber, sugars, sodium, cholesterol, saturatedFat
- **`servings`** — procenjen broj porcija (~550 kcal/porciji)
- **`ingredients[].grams`** — približna gramaža po sastojku (USDA foodMeasures → CUP_DENSITY → lokalne tabele → komadi)
  - **`CUP_DENSITY`** u `scripts/recompute.js` — gustina "1 cup" PO NAMIRNICI (brašno 125g, šećer 200g, mleko 245g, ulje 224g...) — kritično za tačnost, inače "1 cup"=240g dupla kalorije deserta
  - **kJ→kcal** u `recompute.js` — USDA "Energy" ponekad vraća kJ (1220 kJ = 291 kcal); kcal>700 za ne-mast → deli sa 4.184. ⚠️ NE koristi 4-4-9 poređenje (lažno trigira za začíne/alkohol: cimet 249 je tačno)
  - **SVI recepti (789/789)** imaju kalorije; ~91% sastojaka ima gramažu
- **Prikaz u app je PO PORCIJI** (`kcal / servings`) sa "~" (aproksimacija)
- ⚠️ Tačnost je orijentaciona (±15-25%): mere "cups", "cloves", "pinch" su procene; verifikovano 17/18 ključnih namirnica ispravno
- ✅ Top 50 sastojaka (po gramaži): **50/50 tačno** (odstupanja ≤30% su prirodne varijacije: sirovo/kuvano, sa/bez kože)
- ✅ Ispravljene stvarne vrednosne greške u `fix_values.js`. Posle izmene UVIJEK pokrenuti `make_ingredient_map.js` → `recompute.js` (recompute čita MAPU, ne keš!).
  - Top korekcije (kompletan makro set — kcal/masti/UH/proteini/vlakna/šećeri/Na/holesterol/satFat): `baking powder` (bio EAS Soy Protein kcal=405 → 53), `dried white navy beans`/`great northern beans` (bili kcal=0 → 337/339), `chicken stock` (uklonjen dupli ključ → 7), `achiote seeds` (annatto 305), `small potatoes`/`jersey royal`/`baby new`/`floury`/`charlotte` (bili pasulj sa ~330 → sirov krompir 74-87), `rice` (bio kuvani 96 → sirovi 359 — meri se sirovo!), `sushi rice` (359), `mushrooms` (bio prženi 222 → sirovi 22), `courgettes` (bio risoto 320 → sirovi 17), `greek yogurt` (bio 467 → 97), `almonds` (bio butter 641 → sirovi 579), `plantain` (bio čips 531 → 122), `sweetcorn` (bio "tri pasulja" 140 → 86), `sweet potatoes` (bio tots 191 → 86), `clams` (bio Casino 162 → 86), `green beans` (56 → 31), `butter beans` (bis zeleni pasulj 43 → 115 kuvana lima), `water chestnut` (bio brašno 385 → 74), `petit pois` (bio asparagus 28 → 81), `unsweetened coconut milk` (bio bademovo mleko 19 → 227), `beef fillet`/`fillet of steak` (bio Emu → tenderloin 143), `raw king/tiger/frozen prawns` (bio skuša/lagan → shrimp 71), `pork knuckle`/`pigs trotters` (bio "pig in blanket"/mleveno → 171), `sour milk` (bio whiskey sour → buttermilk 43), `black pudding` (bio ribizla → krvavica 379), `chilli powder`/`hot/red` (282), `red chilli flakes`/`chilli flakes` (318), `cinnamon stick` (ispravljen opis "Butter, stick" → cinnamon ground), `dates`(277), `wonton skin`(292), `shaoxing wine`(82), `dry white wine`(82), `golden syrup`(310), `pomegranate molasses`(177), `glace cherry`(165), `vanilla pod`/`almond extract`/`essence`(313), `vanilla powder`(sušena vanilija 247), `cooked beetroot`(bio "apples cooked" → 44), `soya bean`(147), `porridge oats`/`rolled oats`(382 suvi — mere su suve u gramima), `ground oats`(389), `cold/warm/boiling/soda water` (USDA nalazio "Water convolvulus" = vodeni špinat 19 kcal/3g carbs → 0/0), `rose water` (USDA nalazio "Wine, rose" 83 kcal → 0), `baking powder` (carbs 27.6 → 0; kcal 53 ostao).
  - ⚠️ UZROK većine grešaka: USDA search vraća pogrešan "food" za generičke/opisne nazive (npr. "small potatoes"→pasulj, "mushrooms"→pržene, "vanilla pod"→extract). `enrich_nutrition.js` matcher nije dovoljno strog. Preporuka: za nove sastojke proveriti `description` u mapi i po potrebi dodati u `fix_values.js` ili precisan upit u `query_map.json`.
  - 🟡 NEPOTVRĐENO/EGZOTIČNO (nisu menjani jer USDA nema dobru referencu ili je auto-pick nepouzdan): curry paste (thai red/green, madras, panang, massaman, red), gochujang, miso, doubanjiang, harissa, garam masala, ras el hanout, salsa lizano, some condiments. Za ove vrednosti u mapi mogu biti aproksimativne.
  - ✅ Klase D "jašini nazivi" — od 338 prijavljenih, ~299 su lažni pozitivni (matcher ne razume sinonime: mince=ground, plain=all-purpose, cherry=grape tomato, egg wash/egg plants/garlic clove=deskriptori). Samo ~39 je bilo pravo pogrešan food (npr. `flat rice noodles`→Emu meso, `strained yoghurt`→hrana za bebe, `mature cheddar`→šargarepa, `whole black peppercorns`→jaje, `candied peel`→krastavac, `ice cubes`→teletina, `soya milk`→kokos). Ispravljeni kompletno u `fix_values.js` (poslednji blok).
- USDA API ključ je u `scripts/enrich_nutrition.js` (ne commit-ovati u javni repo)

---

## Pokretanje i verifikacija

```
cd mobile
npm install          # prvi put
npm start            # ili npx expo start (Expo Go / emulator)
```

**Pre nego što završiš bilo koju izmenu, OBAVEZNO proveri:**
```
npx tsc --noEmit                              # TypeScript — bez grešaka
npx expo export --platform android            # bundle — mora proći (test)
```
Izbegni veb (`--platform web`) osim ako nisu instalirani `react-dom` + `react-native-web`.

---

## Šta je urađeno (status)

- ✅ 789 recepata (TheMealDB)
- ✅ Točak (Reanimated) + meal-moment čipovi + WheelResultModal + zvuk + ekseri + pointer
- ✅ Svi recepti + pretraga + "Šta imam kod kuće" (premium)
- ✅ Detalji + brojač osoba + izmene recepata (premium) + "vrati na original"
- ✅ Omiljeni
- ✅ Lista za kupovinu (premium) + ručne stavke + "iz planera"
- ✅ Planer obroka (premium, nedeljni)
- ✅ Moji recepti (premium, dodaj/izmeni/obriši)
- ✅ Istorija + Statistika (premium)
- ✅ Premium ekran + locked gating
- ✅ **Nutritivni podaci**: 789/789 recepata ima kalorije/makroe iz USDA
  (kcal/protein/carbs/fats + fiber, sugars, addedSugar, sodium, cholesterol, saturatedFat)
- ✅ **Gramaža sastojaka**: ~91% ima `grams` (USDA + CUP_DENSITY + komadi)
- ✅ **Kanonska mapa** `ingredient_map.json` — deterministički izvor (bez pretrage)
- ✅ UI ceo na **engleskom**; točak testiran na telefonu (Expo Go)
- ⚠️ Premium kupovina je trenutno lokalni flag (NEMA pravog plaćanja/Stripe/in-app)
- ⚠️ Login ne postoji (sve lokalno) — moguće dodati kasnije za cloud/backend
- ⚠️ `DEV_UNLOCK_ALL = true` u premiumService — vratiti na `false` pre lansiranja

---

## 🈺 Višejezičnost (UI + sadržaj baze)

Dve odvojene stvari:

### 1. UI prevodi — `mobile/src/i18n/`
- `en.ts` (izvor) + `de/es/fr/it/pt/sr.ts` — svaki importuje `en` i overriduje ključeve (fallback na en).
- `index.ts` registruje jezike u `resources` + `supported`. Dodaj novi jezik: napravi `xx.ts`, dodaš u `resources` i `supported`, i u listu `LANGUAGES` u `AboutScreen.tsx`.
- ⚠️ **Jezici override-uju CELE sekcije** (npr. `home: { ... }`), pa ključ dodan u `en` ne postoji automatski u ostalim → ispadne engleski.
- **OBAVEZNO** nakon dodavanja bilo kog UI stringa: pokreni `node scripts/check_i18n.js` i popuni prevode koje prijavi. Ne isporučuj prevođenje dok skripta ne prikaže 0 nedostaje.
- Prevod sadržaja baze je **odvojen** od UI prevoda.

### 2. Prevod sadržaja baze (recepti, sastojci, kuhinje, instrukcije)
- **Original `recipes.json` se NIKAD ne menja** (čuva pretragu/filtere). Prevod se prikazuje kao **kopija** recepta.
- Ručno (mali, fiksni skupovi): `mobile/src/i18n/baza/categories.ts` (14 kategorija) i `areas.ts` (37 kuhinja) → prevodi za sve jezike.
- Generisano (offline MT): `data/translations/<lang>.json` + kopija u `mobile/src/data/translations/`. Struktura:
  ```json
  { "ingredients": { "plain flour": "Farine", ... },
    "recipes": { "53483": { "name": "...", "instructions": ["..."] }, ... } }
  ```
- Generiše `scripts/translate_db.js` pomoću **lokalnog offline prevodioca, BEZ API ključa/kartice**:
  - Argos Translate (`argostranslate`) za `fr/es/de/it/pt`
  - OPUS-MT (`perkan/shortL-opus-mt-tc-base-en-sr`) za `sr`
  - Zahteva Python venv sa paketima; postavi `MEALMATE_PYTHON` na `.../venv/Scripts/python.exe`.
- Prikaz: `utils/translateRecipe.ts` + `utils/useTranslatedRecipe.ts` — ekrani pozivaju hook i dobijaju prevedenu kopiju (`r.name`, `r.ingredients`, `r.instructions`, `r.category`, `r.area`). Fallback na engleski ako prevod ne postoji.
- ⚠️ **Pretraga/filteri rade na engleskim vrednostima** — ne prevoditi `name`/`ingredients` u `recipeService` (search/filter), samo u prikazu.
- ⚠️ **Instrukcije se prevode po rečenicama** (Argos je ~3× brži na kratkim rečenicama nego na dugom paragrafu).

## Sledeći mogući koraci
- **Testirati celu app na telefonu** (Expo Go, SDK 54) — točak, ekrani, premium
- **Provjeriti prikaz količina** posle skaliranja `persons/servings` (da nema više "12 cups")
- **Provjeriti nutricioni prikaz** — redosled kao na proizvodima, "More values" expand

### Funkcije koje su polugotove / nedovršene
- **Pravo plaćanje** (Google Play Billing / Apple IAP) za premium — trenutno lokalni flag
- **"Šta imam kod kuće" prikaz u samom točku** (bira samo recepte koje možeš)
- **Zakačeni (pinned) recepti** (max 5, na vrhu) — logika postoji u favorites, UI fali
- **Ocene recepata (1-5) UI** — store ima `rate()`, ekran nema
- **Izmene recepata** — radi (override), ali forma je gruba (jedan TextInput za sve sastojke).
  Moguće poboljšanje: dodavanje pojedinačnih sastojaka u UI.
- **Tamna tema** — reklamirana kao premium (`premium.pfTheme`), ali NE postoji u kodu!
  Pre lansiranja: implementirati (colors u `constants/theme.ts` + `UserSettings.darkMode`).

### Analitika — KAD DOĐE VREME (za sada NEMOJ)
- **Firebase Analytics** (Google, besplatan SDK) — meri šta korisnici rade: event-i `recipe_added`,
  `spun`, `cooked`, `premium_purchased`... Odlučuje kada je baza dovoljno narasla za backend/UGC.
- Store konzola (Play Console / App Store Connect) daje preuzimanja, DAU/WAU, retention — bez koda.
- **Okidač za backend:** 500+ aktivnih dnevno + desetine dodavanja recepata nedeljno.
- **Premium kupovina:** za lansiranje je dovoljan IAP (Google/Apple vode trial i pretplatu);
  backend je tek kasnije za validaciju/sync.

### Budućnost
- Laravel backend (prebaci services/ na API, SQL baza, login, cloud sync)
- Deljenje sopstvenih recepata + zajedničke ocene (UGC) — najjači razlog za backend

## ⚠️ Bitna upozorenja za nastavak rada (naučeno u razvoju)

1. **`recompute.js` koristi `ingredient_map.json`, NE keš.** Ako dodaješ nove recepte/sastojke:
   pokreni `enrich_nutrition.js` → `refine_nutrition.js` → `fix_values.js` → `make_ingredient_map.js` → `recompute.js`.
2. **NE koristi 4-4-9 poređenje za kJ detekciju** — lažno trigira za začíne/alkohol (cimet 249 kcal je tačno).
3. **USDA search je nepouzdan za generičke nazive** ("milk"→coconut milk, "garlic"→garlic sauce).
   Uvek proveri `description` u mapi i dodaj precizan upit u `query_map.json` ako je potrebno.
4. **`transformOrigin` u Reanimated** baca "for input string" na Androidu — ne koristi ga.
5. **Emoji u `SvgText`** su naopaki na Androidu — koristi RN `Text` izvan rotirajućeg točka.
6. **SDK 54** — ne dodaji ručno worklets babel plugin (`babel-preset-expo` to radi sam).
7. **Dupli sastojci u receptu NISU greška** — TheMealDB recepti koriste isti sastojak u više faza
   (npr. Dziriat: "Sugar 1 cup" za sirup + "Sugar 1 cup" za fil). NE spajaj ih u bazi — to su
   ispravni podaci. App prikazuje količine skalirane odnosom `persons/servings`.
8. **USDA "Energy" može biti u kJ i za NISKE vrednosti** (npr. scallions 135 kJ = 32 kcal) —
   prag >700 hvata samo veće; za male, kcal se proverava ručno u mapi.
9. **OBEVEZNO PRAVILO — najbolje je uvek PITATI. Ne menjaj samoleći.** (naučeno)
   - Pre nego što promeniš nešto dok tražiš rešenje (npr. točak, stil, kod) — **prvo pitaj korisnika**,
     pa tek onda menjaj. Ne menjačaj na svoju ruku ako nisi siguran.
   - Ako tražiš rešenje pa pri tome nešto promeniš i rešenje ne da rezultat — **MORAŠ vratiti promene
     na prvobitno stanje** prije nego što završiš. NIKAD ne ostavi eksperimentalne izmene "za svaki slučaj".
   - Nejasnoće/nejasna ponašanja **uvijek pitaj korisnika detaljno**, ne nagađaj.
   - Izuzetak: promene koje su izričito tražene ostaju; eksperimentalne se vraćaju.
   - Bonus: često je uzrok `stari Expo Go bundle` na uređaju → prvo `npx expo start -c` (ili reinstall
     Expo Go) PRIJE nego što menjaš kod. To je uzrokovalo "ne vidi se PRES+ / Healthy samo emoji /
     Home u haosu" — sve bilo stari build, ne logika.

---

## ⚠️ Završni korak pre lansiranja — licence i atribucija (OBAVEZNO)

Pre nego što se objavi/proda app, mora se ispravno obeležiti izvor podataka.
**Ovo je posao za sam kraj razvoja, ali ga je najbolje zabeležiti sada da se ne zaboravi.**

### Izvor recepata i legalni okvir (provereno 2025, službeni Terms of Use)
- Baza recepata dolazi iz **TheMealDB**.
- ⚠️ **Nije** "CC BY-NC-SA" niti "Apache 2.0" — TheMealDB ima **sopstvene Terms of Use**
  (https://www.themealdb.com/terms_of_use.php, ažurirani 01/07/2025).
- Ključne tačke Terms of Use:
  1. **Free API** — smeš koristiti podatke za razvoj, ali **NE smeš objaviti app u app store**
     osim ako si **plaćeni subskriber**.
  2. **Paid API** (premium ključ, ~$10 lifetime) — dozvoljen razvoj app za store,
     **uz obaveznu atribuciju** ("TheMealDB kao izvor podataka").
  3. **Ne smeš preprodavati API** (ključ) trećima; ne smeš skinuti sa API-ja i prisvojiti kao svoj
     artwork (custom artwork moraš link-back na sajt gde je primereno).
  4. Ne smeš uklanjati/izmeniti copyright ili trademark oznake.

### Obaveze koje MORAJU biti urađene (checklist za završni korak)
1. **Nabaviti plaćeni (premium) TheMealDB API ključ** — BEZ njega ne smeš app u app store.
2. **Atribucija u app** — u Info/About/Podešavanja ekranu dodati:
   > "Recipe data sourced from TheMealDB (TheMealDB.com)."
   - Ako je premium — jasno naglasiti da je premium **funkcionalnost** (alati), ne otključavanje same baze.
3. **Bez uklanjanja oznaka** — ne brisati copyright/TM niti prisvajati artwork kao sopstveni.
4. **Obeležiti izmene** — u dokumentaciji (README/AGENTS) naznačiti koje delove je korisnik menjao:
   - "Dodati sopstveni recepti"
   - "Prilagođeni/poboljšani sastojci, makroi i gramaže (kcal/protein/fat/carbs/šećer...) iz USDA"
   - "Sopstveno korisničko iskustvo (točak, planer, kalorijski dnevnik itd.)"
   (Ove izmene ne uklanjaju obavezu iz poante 1 i 2.)

### Kontekst za odluke (konkretno za ovaj projekat)
- Svi recepti (baza) treba da budu **vidljivi svima besplatno** (manji rizik).
- **Premium = napredne funkcije** (npr. "Šta imam kod kuće", planer, statistika, kalorijski dnevnik),
  ne otključavanje same baze. To je najbezbedniji model.
- **Napomena:** čak i sa plaćenim ključem, TheMealDB može smatrati da si u redu, ali
  i dalje **preporučujem** kratku proveru IP-advokata pre velike monetizacije (1 sat).

### Kod za taj korak (indikativno)
- Samo tekst/link u jednom ekranu (npr. `AboutScreen`) + opcioni `LICENSE`/`NOTICE` fajl u `mobile/`
  koji navodi TheMealDB + link na sajt. (+ manuelni komentar u README/AGENTS.)
- Ažurirati ovu checklistu kad se uradi (što je završeno obeležiti).
