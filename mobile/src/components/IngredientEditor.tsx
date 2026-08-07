import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Ingredient } from "../types";
import { suggestIngredients, matchIngredient } from "../services/calorieCalculator";
import { gramsFromAmountAndUnit, pieceApproxGrams } from "../utils/helpers";
import { AppModal, appModalStyles } from "./AppModal";
import { colors } from "../constants/theme";

interface Props {
  ingredients: Ingredient[];
  onChangeIngredients: (ingredients: Ingredient[]) => void;
  onCompute: (kcal: number, protein: number, carbs: number, fats: number) => void;
  onMessage: (msg: string) => void;
}

const UNITS = ["g", "kg", "ml", "cl", "kom", "tbsp", "tsp", "cup"];

/** Unos sastojaka (ime + količina + jedinica + sugestije + lista + Compute). */
export function IngredientEditor({
  ingredients,
  onChangeIngredients,
  onCompute,
  onMessage,
}: Props) {
  const { t } = useTranslation();
  const [ingName, setIngName] = useState("");
  const [ingAmount, setIngAmount] = useState("");
  const [ingUnit, setIngUnit] = useState("g");
  const [ingSug, setIngSug] = useState<{ label: string; type: string }[]>([]);

  function onIngNameChange(text: string) {
    setIngName(text);
    const sug = suggestIngredients(text);
    setIngSug(sug.slice(0, 4).map((s) => ({ label: s.label, type: s.type })));
  }

  function addIngredient() {
    if (!ingName.trim()) {
      onMessage(t("addRecipe.addIngredientName"));
      return;
    }
    const amount = parseFloat(ingAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      onMessage(t("addRecipe.addIngredientAmount"));
      return;
    }
    const ing: Ingredient = {
      name: ingName.trim(),
      amount,
      unit: ingUnit.trim() || "kom",
      measure: "",
      grams: gramsFromAmountAndUnit(amount, ingUnit),
    };
    onChangeIngredients([...ingredients, ing]);
    setIngName("");
    setIngAmount("");
    setIngUnit("g");
  }

  function removeIngredient(idx: number) {
    onChangeIngredients(ingredients.filter((_, i) => i !== idx));
  }

  function computeNutrition() {
    if (ingredients.length === 0) {
      onMessage(t("addRecipe.computeEmpty"));
      return;
    }
    let kcal = 0, p = 0, c = 0, f = 0;
    const unknown: string[] = [];
    for (const ing of ingredients) {
      let g = ing.grams ?? 0;
      if (!g || g <= 0) g = gramsFromAmountAndUnit(ing.amount, ing.unit);
      if (!g || g <= 0) g = pieceApproxGrams(ing.name, ing.unit) * ing.amount;
      const m = matchIngredient(ing.name);
      if (!m) {
        unknown.push(ing.name);
        continue;
      }
      if (!g || g <= 0) {
        unknown.push(`${ing.name} (${ing.amount} ${ing.unit})`);
        continue;
      }
      kcal += (m.per100.kcal * g) / 100;
      p += (m.per100.protein * g) / 100;
      c += (m.per100.carbs * g) / 100;
      f += (m.per100.fat * g) / 100;
    }
    if (kcal <= 0) {
      onMessage(
        unknown.length
          ? t("addRecipe.notFound", { list: unknown.slice(0, 4).join(", ") + (unknown.length > 4 ? "..." : "") })
          : t("addRecipe.noMatch")
      );
      return;
    }
    onCompute(kcal, p, c, f);
    if (unknown.length) {
      onMessage(t("addRecipe.skipped", { list: unknown.slice(0, 4).join(", ") + (unknown.length > 4 ? "..." : "") }));
    }
  }

  return (
    <>
      <Text style={appModalStyles.label}>{t("addRecipe.ingredients")}</Text>
      <View style={styles.ingAddRow}>
        <TextInput
          style={[appModalStyles.input, styles.ingNameInput]}
          value={ingName}
          onChangeText={onIngNameChange}
          placeholder={t("addRecipe.ingredientName")}
          placeholderTextColor={colors.textFaint}
        />
      </View>
      {ingSug.length > 0 && ingName.trim() && (
        <View style={styles.ingSugBox}>
          {ingSug.map((s) => (
            <Pressable
              key={s.label}
              style={styles.ingSugRow}
              onPress={() => {
                setIngName(s.label);
                setIngSug([]);
              }}
            >
              <Text style={styles.ingSugText}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.ingAddRow}>
        <TextInput
          style={[appModalStyles.input, styles.ingAmountInput]}
          value={ingAmount}
          onChangeText={setIngAmount}
          keyboardType="numeric"
          placeholder={t("addRecipe.amount")}
          placeholderTextColor={colors.textFaint}
        />
        <Pressable style={styles.ingAddBtn} onPress={addIngredient}>
          <Text style={styles.ingAddBtnText}>+</Text>
        </Pressable>
      </View>
      <View style={styles.unitChips}>
        {UNITS.map((u) => (
          <Pressable
            key={u}
            style={[styles.unitChip, ingUnit === u && styles.unitChipActive]}
            onPress={() => setIngUnit(u)}
          >
            <Text style={[styles.unitChipText, ingUnit === u && styles.unitChipTextActive]}>{u}</Text>
          </Pressable>
        ))}
      </View>
      {ingredients.length > 0 && (
        <View style={styles.ingList}>
          {ingredients.map((ing, idx) => (
            <View key={idx} style={styles.ingRow}>
              <Text style={styles.ingRowText} numberOfLines={1}>
                {ing.name} — {ing.amount} {ing.unit}
              </Text>
              <Pressable onPress={() => removeIngredient(idx)} hitSlop={8}>
                <Text style={styles.ingDel}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.computeBtn} onPress={computeNutrition}>
        <Text style={styles.computeBtnText}>🧮 {t("addRecipe.compute")}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  ingAddRow: { flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" },
  ingNameInput: { flex: 1 },
  ingAmountInput: { width: 90 },
  unitChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  unitChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitChipText: { color: colors.textMuted, fontSize: 12 },
  unitChipTextActive: { color: "#fff", fontWeight: "700" },
  ingAddBtn: {
    height: 48,
    minWidth: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  ingAddBtnText: { color: "#fff", fontSize: 26, lineHeight: 30, fontWeight: "700" },
  ingList: { marginTop: 10 },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  ingRowText: { flex: 1, color: colors.text, fontSize: 14 },
  ingDel: { color: colors.danger, fontSize: 16 },
  ingSugBox: { marginTop: 8, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 6 },
  ingSugRow: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginVertical: 1,
  },
  ingSugText: { color: colors.success, fontSize: 15, fontWeight: "600" },
  computeBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  computeBtnText: { color: "#fff", fontWeight: "700" },
});
