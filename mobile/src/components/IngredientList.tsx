import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ingredient } from "../types";
import { formatAmount } from "../utils/helpers";
import { translateMeasure } from "../utils/ingredientTranslation";
import { colors } from "../constants/theme";

interface Props {
  ingredients: Ingredient[];
  persons: number;
  servings?: number;
}

export function IngredientList({ ingredients, persons, servings }: Props) {
  return (
    <View>
      {ingredients.map((ing, i) => (
        <View key={i} style={styles.row}>
          <View
            style={[styles.dot, { backgroundColor: colors.wheel[i % colors.wheel.length] }]}
          />
          <Text style={styles.left}>{ing.name}</Text>
          <Text style={styles.right}>{translateMeasure(formatAmount(ing, persons, servings))}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: 0.5,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  left: { flex: 1, color: colors.text, fontSize: 15 },
  right: { color: colors.textMuted, fontSize: 14 },
});
