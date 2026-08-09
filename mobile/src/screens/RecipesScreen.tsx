import React from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { RecipeCard } from "../components/RecipeCard";
import { IngredientInputChips } from "../components/IngredientInputChips";
import { useTranslatedRecipe } from "../utils/useTranslatedRecipe";
import { Recipe } from "../types";
import { recipeService } from "../services/recipeService";
import { useUserStore } from "../store/userStore";
import { useRecipeStore } from "../store/recipeStore";
import { useRecipesFilterStore, RecipesFilters } from "../store/recipesFilterStore";
import { parseIngredientInput } from "../utils/ingredients";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_CHIPS: { key: keyof RecipesFilters; labelKey: string; emoji: string }[] = [
  { key: "keto", labelKey: "recipes.keto", emoji: "🥑" },
  { key: "lowCarb", labelKey: "recipes.lowCarb", emoji: "🥦" },
  { key: "highProtein", labelKey: "recipes.protein", emoji: "💪" },
  { key: "noSugar", labelKey: "recipes.noSugar", emoji: "🫰" },
  { key: "healthy", labelKey: "recipes.healthy", emoji: "🌿" },
  { key: "rich", labelKey: "recipes.rich", emoji: "🍖" },
  { key: "treat", labelKey: "recipes.treat", emoji: "🍰" },
  { key: "vegetarian", labelKey: "recipes.veggie", emoji: "🥬" },
];

// najčešće kuhinje u bazi (za filter po zemlji)
export const AREA_OPTIONS: { label: string; value: string }[] = [
  { label: "British", value: "British" },
  { label: "Spanish", value: "Spanish" },
  { label: "American", value: "United States" },
  { label: "Turkish", value: "Turkish" },
  { label: "French", value: "French" },
  { label: "Chinese", value: "Chinese" },
  { label: "Vietnamese", value: "Vietnamese" },
  { label: "Italian", value: "Italian" },
  { label: "Thai", value: "Thai" },
  { label: "Polish", value: "Polish" },
  { label: "Jamaican", value: "Jamaican" },
  { label: "Indian", value: "Indian" },
  { label: "Japanese", value: "Japanese" },
  { label: "Greek", value: "Greek" },
  { label: "Mexican", value: "Mexican" },
  { label: "Moroccan", value: "Moroccan" },
];

export function RecipesScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { area: areaLabel } = useTranslatedRecipe();
  const { isPremium } = useUserStore();
  const allRecipes = useRecipeStore((s) => s.recipes);
  const userRecipes = allRecipes.filter((r) => r.id.startsWith("user-"));
  const {
    query,
    haveIngredients,
    ingredientInput,
    filters,
    setQuery,
    setIngredientInput,
    addIngredients,
    removeIngredient,
    toggleFilter,
    toggleMax,
    toggleArea,
    clearAll,
  } = useRecipesFilterStore();

  const [showFilters, setShowFilters] = React.useState(false);

  // računamo svaki render (bez useMemo cache-a) da filter uvek reagira na čitulje; 789 filter je brz
  const recipes = (() => {
    let base = recipeService.getAll();
    if (query.trim()) {
      base = recipeService.search(query);
    }
    const wanted = [...haveIngredients];
    const live = ingredientInput.trim().toLowerCase();
    if (live && !wanted.includes(live)) wanted.push(live);
    if (wanted.length > 0) {
      base = recipeService.findByIngredients(wanted);
    }
    const filtered = recipeService.filterMatched({
      keto: filters.keto,
      lowCarb: filters.lowCarb,
      highProtein: filters.highProtein,
      noSugar: filters.noSugar,
      healthy: filters.healthy,
      treat: filters.treat,
      rich: filters.rich,
      vegetarian: filters.vegetarian,
      areas: filters.areas.length ? filters.areas : undefined,
      maxPrep: filters.maxPrep ?? undefined,
      maxKcal: filters.maxKcal ?? undefined,
    }, base);
    // Sopstveni recepti korisnika: prikazuj ih u search-u po imenu/kategoriji
    // (ne prolaze kroz nutricione filtere jer nemaju sve makroe).
    const q = query.trim().toLowerCase();
    if (q) {
      const mineMatch = userRecipes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
      if (mineMatch.length) return [...filtered, ...mineMatch];
    }
    return filtered;
  })();

  const anyFilter =
    filters.keto ||
    filters.lowCarb ||
    filters.highProtein ||
    filters.noSugar ||
    filters.healthy ||
    filters.treat ||
    filters.rich ||
    filters.vegetarian ||
    filters.areas.length > 0 ||
    filters.maxPrep != null ||
    filters.maxKcal != null;

  const compact = !!query.trim();

  function addIngredient() {
    const parts = parseIngredientInput(ingredientInput);
    if (parts.length === 0) return;
    addIngredients(parts);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {!query.trim() && <Text style={styles.title}>{t("recipes.title")}</Text>}
            <View style={[styles.searchRow, compact && styles.searchRowCompact]}>
              <TextInput
                style={styles.search}
                placeholder={t("recipes.searchPlaceholder")}
                value={query}
                onChangeText={setQuery}
                placeholderTextColor={colors.textFaint}
              />
              <Text style={styles.badge}>{recipes.length}</Text>
            </View>

            {!query.trim() && (
              <>{isPremium ? (
              <View style={styles.haveBox}>
                <Text style={styles.haveTitle}>🥘 {t("recipes.haveTitle")}</Text>
                <IngredientInputChips
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  onSubmit={addIngredient}
                  ingredients={haveIngredients}
                  onRemove={removeIngredient}
                  placeholder={t("recipes.havePlaceholder")}
                  hint={
                    haveIngredients.length > 0
                      ? t("recipes.haveHint", { list: haveIngredients.join(", ") })
                      : undefined
                  }
                />
              </View>
            ) : (
              <Pressable style={styles.premiumBanner} onPress={() => nav.navigate("Premium")}>
                <Text style={styles.premiumBannerText}>
                  💎 {t("recipes.premiumBanner")}
                </Text>
              </Pressable>
            )}
            </>)}

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Text style={styles.filterTitle}>⚡ {t("recipes.refine")}</Text>
                {anyFilter && (
                  <Pressable onPress={clearAll} hitSlop={8}>
                    <Text style={styles.filterClear}>{t("recipes.clearFilters")}</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.chipsRow}>
                {FILTER_CHIPS.map((chip) => {
                  const active = Boolean(filters[chip.key]);
                  return (
                    <Pressable
                      key={chip.key}
                      style={[styles.filterChip, active && styles.filterChipOn, compact && styles.filterChipCompact]}
                      onPress={() => toggleFilter(chip.key)}
                    >
                      <Text style={[styles.filterChipText, compact && styles.filterChipTextCompact, active && styles.filterChipTextOn]}>
                        {chip.emoji} {t(chip.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  style={[styles.filterChip, filters.maxPrep != null && styles.filterChipOn, compact && styles.filterChipCompact]}
                  onPress={() => toggleMax("maxPrep", 20)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      compact && styles.filterChipTextCompact,
                      filters.maxPrep != null && styles.filterChipTextOn,
                    ]}
                  >
                    ⏱️ {t("recipes.fast")}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterChip, showFilters && styles.filterChipOn, compact && styles.filterChipCompact]}
                  onPress={() => setShowFilters((s) => !s)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      compact && styles.filterChipTextCompact,
                      showFilters && styles.filterChipTextOn,
                    ]}
                  >
                    {showFilters ? `▾ ${t("recipes.more")}` : `▸ ${t("recipes.more")}`}
                  </Text>
                </Pressable>
              </View>

              {showFilters && (
                <>
                    <View style={styles.chipsRow}>
                      {[400, 600, 800].map((k) => (
                        <Pressable
                          key={k}
                          style={[styles.filterChip, filters.maxKcal === k && styles.filterChipOn, compact && styles.filterChipCompact]}
                          onPress={() => toggleMax("maxKcal", k)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              compact && styles.filterChipTextCompact,
                              filters.maxKcal === k && styles.filterChipTextOn,
                            ]}
                          >
                            {`≤${k} kcal`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={styles.filterSubtitle}>🌍 {t("recipes.cuisine")}</Text>
                    <View style={styles.chipsRow}>
                      {AREA_OPTIONS.map((area) => {
                        const active = filters.areas.includes(area.value);
                        return (
                          <Pressable
                            key={area.value}
                            style={[styles.filterChip, active && styles.filterChipOn, compact && styles.filterChipCompact]}
                            onPress={() => toggleArea(area.value)}
                          >
                            <Text style={[styles.filterChipText, compact && styles.filterChipTextCompact, active && styles.filterChipTextOn]}>
                              {areaLabel(area.label)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
            </View>
          </View>
        }
        renderItem={({ item }: { item: Recipe }) => (
          <RecipeCard recipe={item} onPress={() => nav.navigate("RecipeDetail", { id: item.id })} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingTop: 28 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  badge: {
    minWidth: 34,
    textAlign: "center",
    backgroundColor: colors.primary,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    borderRadius: 17,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  badgeLabel: {
    alignSelf: "flex-end",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 12 },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchRowCompact: { marginTop: 12 },
  search: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  haveBox: {
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 14,
  },
  haveTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  haveInputRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  haveInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  haveAdd: {
    width: 40,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  haveAddText: { color: "#fff", fontSize: 22, lineHeight: 26 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  haveHint: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  premiumBanner: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  premiumBannerText: { color: "#fff", fontWeight: "700" },
  filterSection: { marginTop: 16 },
  filterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  filterTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  filterToggle: { padding: 2 },
  filterSubtitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 14 },
  filterClear: { color: colors.primary, fontWeight: "600" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipCompact: {
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  filterChipTextCompact: { fontSize: 11 },
  filterChipTextOn: { color: "#fff" },
});
