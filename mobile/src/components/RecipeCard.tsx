import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Recipe } from "../types";
import { formatDuration, perServingRound } from "../utils/helpers";
import { colors } from "../constants/theme";
import { useTranslatedRecipe } from "../utils/useTranslatedRecipe";

interface Props {
  recipe: Recipe;
  onPress: () => void;
  modified?: boolean;
}

export function RecipeCard({ recipe, onPress, modified }: Props) {
  const { t } = useTranslation();
  const { translate } = useTranslatedRecipe();
  const r = translate(recipe);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {recipe.imageUrl ? (
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.noImg]}>
          <Text style={styles.noImgText}>🍽️</Text>
        </View>
      )}
      <View style={styles.body}>
        {modified && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t("recipeDetail.edited")}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {r.name}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDuration(recipe.prepTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="fire" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {recipe.calories ? `~${perServingRound(recipe.calories, recipe.servings)} kcal` : "— kcal"}
            </Text>
          </View>
          <Text style={styles.metaText}>{t(`difficulty.${recipe.difficulty}`)}</Text>
        </View>


      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { height: 140, width: "100%", backgroundColor: colors.imageBg },
  noImg: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  noImgText: { fontSize: 40, opacity: 0.6 },
  body: { padding: 12, position: "relative" },
  badge: {
    position: "absolute",
    top: -30,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: colors.textMuted },
});
