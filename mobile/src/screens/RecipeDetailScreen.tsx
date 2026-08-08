import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
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
import { overrideService } from "../services/overrideService";
import { historyService } from "../services/historyService";
import { recipeService } from "../services/recipeService";
import { calorieLogService } from "../services/calorieLogService";
import { useUserStore } from "../store/userStore";
import { useRecipeStore } from "../store/recipeStore";
import { Recipe } from "../types";
import { formatDuration, perServingRound } from "../utils/helpers";
import { DIFFICULTY_LABELS } from "../constants/categories";
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
  const { isPremium, toggleFavorite, favorites } = useUserStore();
  const { translate } = useTranslatedRecipe();
  const recipeStoreGetById = useRecipeStore((s) => s.getById);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [modified, setModified] = useState(false);
  const [persons, setPersons] = useState(2);
  const [editOpen, setEditOpen] = useState(false);
  const [cooked, setCooked] = useState(false);
  const [trackerMsg, setTrackerMsg] = useState<string | null>(null);

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
    const s = recipe.servings || 1;
    const kc = recipe.calories ? Math.round(recipe.calories / s) : null;
    const pr = recipe.protein ? Math.round(recipe.protein / s) : null;
    const fa = recipe.fats ? Math.round(recipe.fats / s) : null;
    const ca = recipe.carbs ? Math.round(recipe.carbs / s) : null;
    const ingredientLines = recipe.ingredients
      .map((i) => `• ${i.measure} ${i.name}`)
      .join("\n");
    const nutrition = [
      kc != null ? `Energy: ${kc} kcal` : "",
      fa != null ? `Fat: ${fa}g` : "",
      ca != null ? `Carbs: ${ca}g` : "",
      pr != null ? `Protein: ${pr}g` : "",
    ].filter(Boolean);
    const instructionLines = recipe.instructions.map((ins) => `• ${ins}`).join("\n");
    const message = [
      `🍽️ ${recipe.name}`,
      recipe.area ? `From ${recipe.area}` : "",
      `Serves ~${s}`,
      `⏱️ ${formatDuration(recipe.prepTime)}`,
      nutrition.length ? "\nNutrition (per serving):" : "",
      ...nutrition,
      "\nIngredients:",
      ingredientLines || "—",
      instructionLines ? "\nInstructions:" : "",
      instructionLines || "",
      "\nMade with MealMate AI",
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
    <SafeAreaView style={styles.safe}>
      <ScrollView>
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
            {isPremium && (
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
                {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
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

          {id.startsWith("user-") && (
            <Pressable
              style={styles.calorieLogBtn}
              onPress={async () => {
                const s = recipe.servings || 1;
                const kcal = recipe.calories
                  ? Math.round((recipe.calories / s) * persons)
                  : 0;
                await calorieLogService.addCookedMeal(recipe.name, kcal, {
                  protein: recipe.protein,
                  carbs: recipe.carbs,
                  fats: recipe.fats,
                });
                setTrackerMsg(
                  `"${recipe.name}" (~${kcal} kcal for ${persons} people) added to today.`
                );
              }}
            >
                <Text style={styles.calorieLogBtnText}>{t("recipeDetail.addToTracker")}</Text>
            </Pressable>
          )}

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

          {!isPremium && (
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
                      {r.name}
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
      </ScrollView>

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
        title="Added to Calorie tracker"
        onClose={() => setTrackerMsg(null)}
        onSave={() => setTrackerMsg(null)}
        saveLabel="OK"
      >
        <Text style={{ color: colors.text }}>{trackerMsg}</Text>
      </AppModal>
    </SafeAreaView>
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
