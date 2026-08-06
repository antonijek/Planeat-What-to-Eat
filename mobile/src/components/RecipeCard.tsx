import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Recipe } from "../types";
import { formatDuration } from "../utils/helpers";
import { DIFFICULTY_LABELS } from "../constants/categories";
import { colors } from "../constants/theme";

interface Props {
  recipe: Recipe;
  onPress: () => void;
  modified?: boolean;
}

export function RecipeCard({ recipe, onPress, modified }: Props) {
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
            <Text style={styles.badgeText}>EDITED</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {recipe.name}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDuration(recipe.prepTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="fire" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {recipe.calories ? `~${Math.round(recipe.calories / (recipe.servings || 1))} kcal` : "— kcal"}
            </Text>
          </View>
          <Text style={styles.metaText}>{DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</Text>
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
