import React, { useEffect, useState } from "react";
import { Text, TextInput, View, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Difficulty, Recipe } from "../types";
import { overrideService } from "../services/overrideService";
import { textToLines } from "../utils/ingredients";
import { AppModal, appModalStyles } from "./AppModal";
import { IngredientEditor } from "./IngredientEditor";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  recipe: Recipe;
  onClose: () => void;
  onSaved: () => void;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function EditRecipeModal({ visible, recipe, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(recipe.name);
  const [category, setCategory] = useState(recipe.category);
  const [prepTime, setPrepTime] = useState(String(recipe.prepTime));
  const [difficulty, setDifficulty] = useState<Difficulty>(recipe.difficulty);
  const [servings, setServings] = useState(String(recipe.servings ?? ""));
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl ?? "");
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [instructions, setInstructions] = useState("");
  const [calories, setCalories] = useState(String(recipe.calories ?? ""));
  const [protein, setProtein] = useState(String(recipe.protein ?? ""));
  const [carbs, setCarbs] = useState(String(recipe.carbs ?? ""));
  const [fats, setFats] = useState(String(recipe.fats ?? ""));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(recipe.name);
      setCategory(recipe.category);
      setPrepTime(String(recipe.prepTime));
      setDifficulty(recipe.difficulty);
      setServings(String(recipe.servings ?? ""));
      setImageUrl(recipe.imageUrl ?? "");
      setIngredients(recipe.ingredients);
      setInstructions(recipe.instructions.join("\n"));
      setCalories(String(recipe.calories ?? ""));
      setProtein(String(recipe.protein ?? ""));
      setCarbs(String(recipe.carbs ?? ""));
      setFats(String(recipe.fats ?? ""));
      setMessage(null);
    }
  }, [visible, recipe]);

  function handleCompute(kcal: number, p: number, c: number, f: number) {
    setCalories(String(Math.round(kcal)));
    setProtein(String(Math.round(p)));
    setCarbs(String(Math.round(c)));
    setFats(String(Math.round(f)));
  }

  async function save() {
    if (!name.trim()) {
      setMessage(t("addRecipe.nameRequired"));
      return;
    }
    await overrideService.update(recipe.id, {
      name: name.trim() || undefined,
      category: category.trim() || undefined,
      prepTime: parseInt(prepTime) || recipe.prepTime,
      difficulty,
      servings: parseInt(servings) || undefined,
      imageUrl: imageUrl.trim() || undefined,
      ingredients,
      instructions: textToLines(instructions),
      calories: parseInt(calories) || undefined,
      protein: parseInt(protein) || undefined,
      carbs: parseInt(carbs) || undefined,
      fats: parseInt(fats) || undefined,
    });
    onSaved();
    onClose();
  }

  return (
    <AppModal
      visible={visible}
      title={t("addRecipe.titleEdit")}
      onClose={onClose}
      onSave={save}
      saveLabel={t("common.save")}
    >
      <Text style={appModalStyles.label}>{t("addRecipe.name")}</Text>
      <TextInput style={appModalStyles.input} value={name} onChangeText={setName} />

      <Text style={appModalStyles.label}>{t("addRecipe.category")}</Text>
      <TextInput style={appModalStyles.input} value={category} onChangeText={setCategory} />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>{t("addRecipe.timeMinutes")}</Text>
          <TextInput
            style={appModalStyles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>{t("addRecipe.servings")}</Text>
          <TextInput
            style={appModalStyles.input}
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
          />
        </View>
      </View>

      <IngredientEditor
        ingredients={ingredients}
        onChangeIngredients={setIngredients}
        onCompute={handleCompute}
        onMessage={setMessage}
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>{t("addRecipe.calories")}</Text>
          <TextInput
            style={appModalStyles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>{t("addRecipe.proteinG")}</Text>
          <TextInput
            style={appModalStyles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>{t("addRecipe.carbsG")}</Text>
          <TextInput
            style={appModalStyles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>{t("addRecipe.fatG")}</Text>
          <TextInput
            style={appModalStyles.input}
            value={fats}
            onChangeText={setFats}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={appModalStyles.label}>{t("addRecipe.difficulty")}</Text>
      <View style={styles.diffRow}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
              {t(`difficulty.${d}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={appModalStyles.label}>{t("addRecipe.imageUrl")}</Text>
      <TextInput
        style={appModalStyles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://..."
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
      />

      <Text style={appModalStyles.label}>{t("addRecipe.instructions")}</Text>
      <TextInput
        style={[appModalStyles.input, appModalStyles.multiline]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholderTextColor={colors.textFaint}
      />

      <AppModal
        visible={message !== null}
        title={t("addRecipe.headsUp")}
        onClose={() => setMessage(null)}
        onSave={() => setMessage(null)}
        saveLabel={t("common.ok")}
      >
        <Text style={{ color: colors.text }}>{message}</Text>
      </AppModal>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  diffRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  diffBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  diffBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  diffText: { color: colors.textMuted, fontSize: 14 },
  diffTextActive: { color: "#fff", fontWeight: "700" },
});
