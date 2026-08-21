import React, { useMemo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  ingredients: string[];
  onRemove: (ingredient: string) => void;
  placeholder?: string;
  hint?: string;
  emptyHint?: string;
}

/** Zajednički unos sastojaka (+ chips lista) za "Šta imam kod kuće" (trak/ui). */
export function IngredientInputChips({
  value,
  onChangeText,
  onSubmit,
  ingredients,
  onRemove,
  placeholder,
  hint,
  emptyHint,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ph = placeholder ?? t("recipes.havePlaceholder");
  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={ph}
          placeholderTextColor={colors.textFaint}
        />
        <Pressable style={styles.add} onPress={onSubmit} hitSlop={8}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>
      {ingredients.length > 0 && (
        <View style={styles.chips}>
          {ingredients.map((ing) => (
            <Pressable key={ing} style={styles.chip} onPress={() => onRemove(ing)}>
              <Text style={styles.chipText}>{ing} ✕</Text>
            </Pressable>
          ))}
        </View>
      )}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {!hint && ingredients.length === 0 && emptyHint ? (
        <Text style={styles.hint}>{emptyHint}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    inputRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    input: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    add: {
      width: 44,
      backgroundColor: colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    addText: { color: "#fff", fontSize: 22, lineHeight: 26 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    chip: {
      backgroundColor: colors.primaryLight,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chipText: { color: colors.text, fontWeight: "600" },
    hint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  });
