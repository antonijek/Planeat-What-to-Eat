import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Recipe } from "../types";
import { perServing, perServingRound } from "../utils/helpers";
import { useTheme, ThemeColors } from "../constants/theme";

/** Nutricioni prikaz recepta (po porciji), kao na proizvodima + "More values". */
export function NutritionTable({ recipe }: { recipe: Recipe }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showMore, setShowMore] = useState(false);
  const s = recipe.servings;

  return (
    <View style={styles.nutritionCard}>
      <View style={styles.nutritionHeader}>
        <Text style={styles.nutritionTitle}>{t("recipeDetail.nutritionPerServing")}</Text>
        {recipe.servings ? <Text style={styles.nutritionServing}>{t("recipeDetail.servings", { count: recipe.servings })}</Text> : null}
      </View>
      {recipe.calories ? (
        <Text style={styles.nutritionTotal}>
          {t("recipeDetail.wholeRecipe", {
            total: recipe.calories.toLocaleString(),
            per: perServingRound(recipe.calories, s),
          })}
        </Text>
      ) : null}

      {/* Glavni red — kao na proizvodima */}
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>{t("recipeDetail.energy")}</Text>
        <Text style={styles.nutritionValue}>
          {recipe.calories ? `~${perServingRound(recipe.calories, s)} kcal` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>{t("recipeDetail.fat")}</Text>
        <Text style={styles.nutritionValue}>
          {recipe.fats ? `~${perServingRound(recipe.fats, s)}g` : "—"}
        </Text>
      </View>
      <View style={[styles.nutritionRow, styles.nutritionRowSub]}>
        <Text style={styles.nutritionNameSub}>{t("recipeDetail.ofWhichSaturates")}</Text>
        <Text style={styles.nutritionValueSub}>
          {recipe.saturatedFat ? `~${perServingRound(recipe.saturatedFat, s)}g` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>{t("recipeDetail.carbohydrate")}</Text>
        <Text style={styles.nutritionValue}>
          {recipe.carbs ? `~${perServingRound(recipe.carbs, s)}g` : "—"}
        </Text>
      </View>
      <View style={[styles.nutritionRow, styles.nutritionRowSub]}>
        <Text style={styles.nutritionNameSub}>{t("recipeDetail.ofWhichSugars")}</Text>
        <Text style={styles.nutritionValueSub}>
          {recipe.addedSugar ? `~${perServingRound(recipe.addedSugar, s)}g` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>{t("recipeDetail.protein")}</Text>
        <Text style={styles.nutritionValue}>
          {recipe.protein ? `~${perServingRound(recipe.protein, s)}g` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>{t("recipeDetail.fiber")}</Text>
        <Text style={styles.nutritionValue}>
          {recipe.fiber ? `~${perServingRound(recipe.fiber, s)}g` : "—"}
        </Text>
      </View>

      {/* Još — dodatne vrednosti */}
      <Pressable onPress={() => setShowMore(!showMore)} style={styles.moreBtn}>
        <Text style={styles.moreBtnText}>{showMore ? t("recipeDetail.showLess") : t("recipeDetail.moreValues")}</Text>
      </Pressable>
      {showMore && (
        <View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionName}>{t("recipeDetail.salt")}</Text>
            <Text style={styles.nutritionValue}>
              {recipe.sodium ? `~${(perServing(recipe.sodium, s) / 1000).toFixed(1)}g` : "—"}
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionName}>{t("recipeDetail.cholesterol")}</Text>
            <Text style={styles.nutritionValue}>
              {recipe.cholesterol ? `~${perServingRound(recipe.cholesterol, s)}mg` : "—"}
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionName}>{t("recipeDetail.sodium")}</Text>
            <Text style={styles.nutritionValue}>
              {recipe.sodium ? `~${perServingRound(recipe.sodium, s)}mg` : "—"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    nutritionCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
    },
    nutritionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    nutritionTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
    nutritionServing: { fontSize: 12, color: colors.textMuted },
    nutritionTotal: { fontSize: 12, color: colors.textMuted, marginBottom: 8, fontStyle: "italic" },
    nutritionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    nutritionRowSub: { paddingLeft: 12 },
    nutritionName: { fontSize: 13, color: colors.text },
    nutritionNameSub: { fontSize: 12, color: colors.textMuted },
    nutritionValue: { fontSize: 13, color: colors.text, fontWeight: "600" },
    nutritionValueSub: { fontSize: 12, color: colors.textMuted },
    moreBtn: { marginTop: 8, alignSelf: "flex-start" },
    moreBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  });
