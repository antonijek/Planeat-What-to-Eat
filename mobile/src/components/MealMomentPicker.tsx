import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MEAL_MOMENTS } from "../constants/mealMoments";
import { colors } from "../constants/theme";

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function MealMomentPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.chip, selected === null && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, selected === null && styles.chipTextActive]}>✨ All</Text>
      </Pressable>
      {MEAL_MOMENTS.map((m) => {
        const active = selected === m.id;
        return (
          <Pressable
            key={m.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? null : m.id)}
          >
            <Text style={styles.chipEmoji}>{m.emoji}</Text>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
