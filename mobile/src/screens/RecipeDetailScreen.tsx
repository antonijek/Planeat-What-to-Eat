import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Share,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { PersonStepper } from "../components/PersonStepper";
import { IngredientList } from "../components/IngredientList";
import { NutritionTable } from "../components/NutritionTable";
import { EditRecipeModal } from "../components/EditRecipeModal";
import { AppModal } from "../components/AppModal";
import { Screen } from "../components/Screen";
import { overrideService } from "../services/overrideService";
import { historyService } from "../services/historyService";
import { recipeService } from "../services/recipeService";
import { calorieLogService } from "../services/calorieLogService";
import { planService } from "../services/planService";
import { isFeatureUnlocked } from "../services/premiumService";
import { MealPlanEntry } from "../types";
import { useUserStore } from "../store/userStore";
import { useRecipeStore } from "../store/recipeStore";
import { Recipe } from "../types";
import { formatDuration, perServingRound } from "../utils/helpers";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";
import { useTranslatedRecipe } from "../utils/useTranslatedRecipe";

type Route = RouteProp<RootStackParamList, "RecipeDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RecipeDetailScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { id } = route.params;
  const { isPremium, trialActive, toggleFavorite, favorites } = useUserStore();
  const { translate } = useTranslatedRecipe();
  const recipeStoreGetById = useRecipeStore((s) => s.getById);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [modified, setModified] = useState(false);
  const [persons, setPersons] = useState(2);
  const [editOpen, setEditOpen] = useState(false);
  const [cooked, setCooked] = useState(false);
  const [trackerMsg, setTrackerMsg] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [planDay, setPlanDay] = useState(0);
  const [planMeal, setPlanMeal] = useState<"lunch" | "dinner">("lunch");
  const [planMsg, setPlanMsg] = useState<string | null>(null);
  const [planEntries, setPlanEntries] = useState<MealPlanEntry[]>([]);

  function openPlanModal() {
    setPlanOpen(true);
    planService.getPlan().then(setPlanEntries);
  }

  const isFav = favorites.some((f) => f.recipeId === id);

  useEffect(() => {
    if (id.startsWith("user-")) {
      recipeStoreGetById(id).then((r) => {
        setRecipe(r);
        if (r.servings) setPersons(r.servings);
      });
      setModified(false);
    } else {
      overrideService.getEffective(id).then((r) => {
        setRecipe(r);
        if (r.servings) setPersons(r.servings);
      });
      overrideService.isModified(id).then(setModified);
    }
    historyService.isCooked(id).then(setCooked);
  }, [id]);

  async function handleShare() {
    if (!recipe) return;
    const translated = translate(recipe);
    const s = recipe.servings || 1;
    const kc = recipe.calories ? Math.round(recipe.calories / s) : null;
    const pr = recipe.protein ? Math.round(recipe.protein / s) : null;
    const fa = recipe.fats ? Math.round(recipe.fats / s) : null;
    const ca = recipe.carbs ? Math.round(recipe.carbs / s) : null;
    const ingredientLines = recipe.ingredients
      .map((i) => `• ${i.measure} ${i.name}`)
      .join("\n");
    const nutrition = [
      kc != null ? `${t("recipeDetail.energy")}: ${kc} kcal` : "",
      fa != null ? `${t("recipeDetail.fat")}: ${fa}g` : "",
      ca != null ? `${t("recipeDetail.carbohydrate")}: ${ca}g` : "",
      pr != null ? `${t("recipeDetail.protein")}: ${pr}g` : "",
    ].filter(Boolean);
    const instructionLines = recipe.instructions.map((ins) => `• ${ins}`).join("\n");
    const message = [
      `🍽️ ${translated.name}`,
      recipe.area ? t("recipeDetail.shareFrom", { area: translated.area }) : "",
      t("recipeDetail.shareServes", { count: s }),
      `⏱️ ${formatDuration(recipe.prepTime)}`,
      nutrition.length ? t("recipeDetail.shareNutrition") : "",
      ...nutrition,
      t("recipeDetail.ingredients") + ":",
      ingredientLines || "—",
      instructionLines ? t("recipeDetail.instructions") + ":" : "",
      instructionLines || "",
      t("recipeDetail.shareMadeWith"),
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await Share.share({ message });
    } catch {
      // korisnik je otkazao deljenje ili došlo do greške — tiho ignoriši
    }
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24, color: colors.textMuted }}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  const r = translate(recipe);
  const similar = recipeService
    .getAll()
    .filter((x) => x.id !== id && x.category === recipe.category)
    .sort(
      (a, b) =>
        Math.abs(a.prepTime - recipe.prepTime) - Math.abs(b.prepTime - recipe.prepTime)
    )
    .slice(0, 3);

  return (
    <Screen>
      {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImg]}>
            <Text style={styles.noImgText}>🍽️</Text>
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{r.name}</Text>
            {isFeatureUnlocked("editRecipes", isPremium, trialActive) && (
              <Pressable onPress={() => setEditOpen(true)} hitSlop={8} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️</Text>
              </Pressable>
            )}
            <Pressable onPress={handleShare} hitSlop={8} style={styles.editBtn}>
              <Text style={styles.editBtnText}>📤</Text>
            </Pressable>
            <Pressable onPress={() => toggleFavorite(id)} hitSlop={8}>
              <Text style={{ fontSize: 26 }}>{isFav ? "❤️" : "🤍"}</Text>
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{r.category}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{r.area || "General"}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{formatDuration(recipe.prepTime)}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {t(`difficulty.${recipe.difficulty}`)}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.cookedBtn, cooked && styles.cookedBtnOn]}
            onPress={async () => {
              if (cooked) {
                await historyService.removeCooked(id);
                setCooked(false);
              } else {
                await historyService.recordCooked(id);
                setCooked(true);
              }
            }}
          >
            <Text style={[styles.cookedBtnText, cooked && styles.cookedBtnTextOn]}>
                  {cooked ? t("recipeDetail.cookedThisDone") : t("recipeDetail.cookedThis")}
            </Text>
          </Pressable>

          {(recipe.calories > 0 || (recipe.protein ?? 0) > 0 || (recipe.carbs ?? 0) > 0) && (
            <Pressable
              style={styles.calorieLogBtn}
              onPress={async () => {
                if (!isFeatureUnlocked("calorieTracker", isPremium, trialActive)) {
                  nav.navigate("Premium");
                  return;
                }
                const s = recipe.servings || 1;
                // Dnevnik prati JEDNU porciju (kcal/makroi za jedan obrok),
                // jer recept u bazi opisuje celu seriju. Po potrebi se doda više puta.
                const round = (v?: number) =>
                  v && Number.isFinite(v) ? Math.round(v / s) : undefined;
                const kcal = recipe.calories ? Math.round(recipe.calories / s) : 0;
                await calorieLogService.addCookedMeal(r.name, kcal, {
                  protein: round(recipe.protein),
                  carbs: round(recipe.carbs),
                  fats: round(recipe.fats),
                });
                setTrackerMsg(
                  t("recipeDetail.addedPerServing", { name: r.name, kcal })
                );
              }}
            >
                <Text style={styles.calorieLogBtnText}>{t("recipeDetail.addToTracker")}</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.planBtn}
            onPress={() => {
              if (!isFeatureUnlocked("planer", isPremium, trialActive)) {
                nav.navigate("Premium");
                return;
              }
              openPlanModal();
            }}
          >
            <Text style={styles.planBtnText}>📅 {t("recipeDetail.addToPlaner")}</Text>
          </Pressable>

          <NutritionTable recipe={recipe} />

          <Text style={styles.section}>{t("recipeDetail.numberPeople", { count: recipe.servings || "?" })}</Text>
          <PersonStepper value={persons} onChange={setPersons} />

          <Text style={styles.section}>{t("recipeDetail.ingredients")}</Text>
          <IngredientList ingredients={r.ingredients} persons={persons} servings={recipe.servings} />

          <Text style={styles.section}>{t("recipeDetail.instructions")}</Text>
          {r.instructions.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          {modified && (
            <Pressable
              style={styles.resetBtn}
              onPress={async () => {
                await overrideService.reset(id);
                setModified(false);
                setRecipe(await overrideService.getEffective(id));
              }}
            >
                      <Text style={styles.resetText}>↩︎ {t("recipeDetail.resetChanges")}</Text>
            </Pressable>
          )}

          {!isFeatureUnlocked("editRecipes", isPremium, trialActive) && (
            <Pressable style={styles.premiumBtn} onPress={() => nav.navigate("Premium")}>
              <Text style={styles.premiumText}>💎 Unlock recipe editing</Text>
            </Pressable>
          )}

          {similar.length > 0 && (
            <View style={styles.similarBlock}>
              <Text style={styles.section}>{t("recipeDetail.similar")}</Text>
              {similar.map((r) => (
                <Pressable
                  key={r.id}
                  style={styles.similarRow}
                  onPress={() => nav.replace("RecipeDetail", { id: r.id })}
                >
                  {r.imageUrl ? (
                    <Image source={{ uri: r.imageUrl }} style={styles.similarThumb} />
                  ) : (
                    <View style={[styles.similarThumb, styles.similarPlaceholder]} />
                  )}
                  <View style={styles.similarBody}>
                    <Text style={styles.similarName} numberOfLines={1}>
                      {translate(r).name}
                    </Text>
                    <Text style={styles.similarMeta}>
                      ⏱️ {formatDuration(r.prepTime)}
                      {r.calories
                        ? ` · ~${perServingRound(r.calories, r.servings)} kcal`
                        : ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

      {recipe && (
        <EditRecipeModal
          visible={editOpen}
          recipe={recipe}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            setRecipe(await overrideService.getEffective(id));
            setModified(await overrideService.isModified(id));
          }}
        />
      )}

      <AppModal
        visible={trackerMsg !== null}
        title={t("recipeDetail.addedTitle")}
        onClose={() => setTrackerMsg(null)}
        onSave={() => setTrackerMsg(null)}
        saveLabel="OK"
      >
        <Text style={{ color: colors.text }}>{trackerMsg}</Text>
      </AppModal>

      <AppModal
        visible={planMsg !== null}
        title={t("recipeDetail.addToPlaner")}
        onClose={() => setPlanMsg(null)}
        onSave={() => setPlanMsg(null)}
        saveLabel="OK"
      >
        <Text style={{ color: colors.text }}>{planMsg}</Text>
      </AppModal>

      <AppModal
        visible={planOpen}
        title={t("recipeDetail.addToPlaner")}
        onClose={() => setPlanOpen(false)}
        onSave={async () => {
          const entry: MealPlanEntry = {
            id: `${planDay}-${planMeal}`,
            dayOfWeek: planDay,
            mealType: planMeal,
            recipeId: recipe.id,
            persons: persons,
          };
          await planService.upsert(entry);
          setPlanOpen(false);
          setPlanMsg(t("recipeDetail.addedToPlaner"));
        }}
        saveLabel={t("recipeDetail.planToAdd")}
      >
        <Text style={styles.planSectionLabel}>{t("recipeDetail.planDay")}</Text>
        <View style={styles.planDayRow}>
          {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d, i) => (
            <Pressable
              key={d}
              style={[styles.planDayChip, planDay === i && styles.planDayChipOn]}
              onPress={() => setPlanDay(i)}
            >
              <Text style={[styles.planDayText, planDay === i && styles.planDayTextOn]}>{t(`planer.${d}`)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.planSectionLabel}>{t("recipeDetail.planMeal")}</Text>
        <View style={styles.planDayRow}>
          <Pressable
            style={[styles.planMealBtn, planMeal === "lunch" && styles.planMealBtnOn]}
            onPress={() => setPlanMeal("lunch")}
          >
            <Text style={[styles.planMealText, planMeal === "lunch" && styles.planMealTextOn]}>
              {t("mealMoment.lunch")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.planMealBtn, planMeal === "dinner" && styles.planMealBtnOn]}
            onPress={() => setPlanMeal("dinner")}
          >
            <Text style={[styles.planMealText, planMeal === "dinner" && styles.planMealTextOn]}>
              {t("mealMoment.dinner")}
            </Text>
          </Pressable>
        </View>

        {(() => {
          const existing = planEntries.find(
            (p) => p.dayOfWeek === planDay && p.mealType === planMeal
          );
          if (!existing) return null;
          const existingRecipe = recipeService.getById(existing.recipeId);
          return (
            <View style={styles.planOccupied}>
              <Text style={styles.planOccupiedText}>
                {t("recipeDetail.planOccupied", {
                  name: existingRecipe ? translate(existingRecipe).name : "",
                })}
              </Text>
            </View>
          );
        })()}
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", height: 240, backgroundColor: colors.imageBg },
  noImg: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  noImgText: { fontSize: 72, opacity: 0.6 },
  body: { padding: 20 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  editBtnText: { fontSize: 16 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { backgroundColor: colors.primaryLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  cookedBtn: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.card,
    paddingVertical: 12,
    alignItems: "center",
  },
  cookedBtnOn: { backgroundColor: colors.primary },
  cookedBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  cookedBtnTextOn: { color: "#fff" },
  calorieLogBtn: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  calorieLogBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  planBtn: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  planBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  planSectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 10, marginBottom: 6 },
  planDayRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  planDayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  planDayChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  planDayText: { fontSize: 13, fontWeight: "600", color: colors.text },
  planDayTextOn: { color: "#fff" },
  planMealBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  planMealBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  planMealText: { fontSize: 14, fontWeight: "600", color: colors.text },
  planMealTextOn: { color: "#fff" },
  planOccupied: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  planOccupiedText: { color: colors.text, fontSize: 13, lineHeight: 18 },
  section: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 8 },
  step: { flexDirection: "row", marginBottom: 12, alignItems: "flex-start" },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  stepText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  resetBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetText: { color: colors.primary, fontWeight: "700" },
  premiumBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  premiumText: { color: "#fff", fontWeight: "700" },
  similarBlock: { marginTop: 8 },
  similarRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  similarThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.card },
  similarPlaceholder: { backgroundColor: colors.placeholderBg },
  similarBody: { flex: 1, marginLeft: 12 },
  similarName: { fontSize: 15, fontWeight: "600", color: colors.text },
  similarMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
