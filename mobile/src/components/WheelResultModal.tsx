import React from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Recipe } from "../types";
import { formatDuration } from "../utils/helpers";
import { getRecipeEmoji } from "../utils/emoji";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";

interface Props {
  recipe: Recipe | null;
  onView: () => void;
  onSpinAgain: () => void;
}

export function WheelResultModal({ recipe, onView, onSpinAgain }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={recipe != null}
      animationType="fade"
      transparent
      onRequestClose={onView}
    >
      {recipe && (
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>{getRecipeEmoji(recipe.name)}</Text>
            <Text style={styles.title}>🎉 {t("wheelResult.yourMeal")}:</Text>
            <Text style={styles.name}>{recipe.name}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>{recipe.category}</Text>
              <Text style={styles.meta}>{formatDuration(recipe.prepTime)}</Text>
              {recipe.imageUrl ? (
                <Image source={{ uri: recipe.imageUrl }} style={styles.thumb} />
              ) : null}
            </View>

            <Pressable style={styles.primaryBtn} onPress={onView}>
              <Text style={styles.primaryText}>{t("wheelResult.view")}</Text>
            </Pressable>
            <Pressable onPress={onSpinAgain} hitSlop={8}>
              <Text style={styles.secondaryText}>{t("wheelResult.spinAgain")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  emoji: { fontSize: 56 },
  title: { fontSize: 15, color: colors.textMuted, marginTop: 12 },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  meta: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  primaryBtn: {
    marginTop: 22,
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryText: { color: colors.primary, fontWeight: "600", marginTop: 14 },
});
