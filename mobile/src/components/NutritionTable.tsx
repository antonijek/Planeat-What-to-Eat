import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Recipe } from "../types";
import { perServing, perServingRound } from "../utils/helpers";
import { colors } from "../constants/theme";

/** Nutricioni prikaz recepta (po porciji), kao na proizvodima + "More values". */
export function NutritionTable({ recipe }: { recipe: Recipe }) {
  const [showMore, setShowMore] = useState(false);
  const s = recipe.servings;

  return (
    <View style={styles.nutritionCard}>
      <View style={styles.nutritionHeader}>
        <Text style={styles.nutritionTitle}>Nutrition per serving</Text>
        {recipe.servings ? <Text style={styles.nutritionServing}>{recipe.servings} servings</Text> : null}
      </View>
      {recipe.calories ? (
        <Text style={styles.nutritionTotal}>
          Whole recipe: ~{recipe.calories.toLocaleString()} kcal · per serving: ~
          {perServingRound(recipe.calories, s)} kcal
        </Text>
      ) : null}

      {/* Glavni red — kao na proizvodima */}
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>Energy</Text>
        <Text style={styles.nutritionValue}>
          {recipe.calories ? `~${perServingRound(recipe.calories, s)} kcal` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>Fat</Text>
        <Text style={styles.nutritionValue}>
          {recipe.fats ? `~${perServingRound(recipe.fats, s)}g` : "—"}
        </Text>
      </View>
      <View style={[styles.nutritionRow, styles.nutritionRowSub]}>
        <Text style={styles.nutritionNameSub}>of which saturates</Text>
        <Text style={styles.nutritionValueSub}>
          {recipe.saturatedFat ? `~${perServingRound(recipe.saturatedFat, s)}g` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>Carbohydrate</Text>
        <Text style={styles.nutritionValue}>
          {recipe.carbs ? `~${perServingRound(recipe.carbs, s)}g` : "—"}
        </Text>
      </View>
      <View style={[styles.nutritionRow, styles.nutritionRowSub]}>
        <Text style={styles.nutritionNameSub}>of which sugars (added)</Text>
        <Text style={styles.nutritionValueSub}>
          {recipe.addedSugar ? `~${perServingRound(recipe.addedSugar, s)}g` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>Protein</Text>
        <Text style={styles.nutritionValue}>
          {recipe.protein ? `~${perServingRound(recipe.protein, s)}g` : "—"}
        </Text>
      </View>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionName}>Fiber</Text>
        <Text style={styles.nutritionValue}>
          {recipe.fiber ? `~${perServingRound(recipe.fiber, s)}g` : "—"}
        </Text>
      </View>

      {/* Još — dodatne vrednosti */}
      <Pressable onPress={() => setShowMore(!showMore)} style={styles.moreBtn}>
        <Text style={styles.moreBtnText}>{showMore ? "Show less" : "More values"}</Text>
      </Pressable>
      {showMore && (
        <View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionName}>Salt</Text>
            <Text style={styles.nutritionValue}>
              {recipe.sodium ? `~${(perServing(recipe.sodium, s) / 1000).toFixed(1)}g` : "—"}
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionName}>Cholesterol</Text>
            <Text style={styles.nutritionValue}>
              {recipe.cholesterol ? `~${perServingRound(recipe.cholesterol, s)}mg` : "—"}
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionName}>Sodium</Text>
            <Text style={styles.nutritionValue}>
              {recipe.sodium ? `~${perServingRound(recipe.sodium, s)}mg` : "—"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
