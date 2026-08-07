import React, { useEffect, useState } from "react";
import { Text, TextInput, Pressable, View, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Difficulty, Ingredient, Recipe } from "../types";
import { myRecipesService } from "../services/myRecipesService";
import { textToIngredients, textToLines } from "../utils/ingredients";
import { parseRecipeText } from "../utils/importRecipe";
import { AppModal, appModalStyles } from "./AppModal";
import { IngredientEditor } from "./IngredientEditor";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  editing: Recipe | null;
  onClose: () => void;
  onSaved: () => void;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function AddRecipeModal({ visible, editing, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [prepTime, setPrepTime] = useState("30");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [servings, setServings] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructionsText, setInstructionsText] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(editing?.name ?? "");
      setCategory(editing?.category ?? "Other");
      setPrepTime(String(editing?.prepTime ?? 30));
      setDifficulty(editing?.difficulty ?? "medium");
      setCalories(String(editing?.calories ?? ""));
      setProtein(String(editing?.protein ?? ""));
      setCarbs(String(editing?.carbs ?? ""));
      setFats(String(editing?.fats ?? ""));
      setServings(String(editing?.servings ?? ""));
      setImageUrl(editing?.imageUrl ?? "");
      setIngredients(editing?.ingredients ?? []);
      setInstructionsText((editing?.instructions ?? []).join("\n"));
      setMessage(null);
    }
  }, [visible, editing]);

  function handleCompute(kcal: number, protein: number, carbs: number, fats: number) {
    setCalories(String(Math.round(kcal)));
    setProtein(String(Math.round(protein)));
    setCarbs(String(Math.round(carbs)));
    setFats(String(Math.round(fats)));
    if (!servings.trim()) {
      setServings(String(Math.max(1, Math.round(kcal / 550))));
    }
  }

  async function save() {
    if (!name.trim()) {
      setMessage(t("addRecipe.nameRequired"));
      return;
    }
    const data = {
      name: name.trim(),
      category: category.trim() || "Other",
      prepTime: parseInt(prepTime) || 30,
      difficulty,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fats: parseInt(fats) || 0,
      servings: parseInt(servings) || undefined,
      area: "",
      ingredients,
      instructions: textToLines(instructionsText),
      imageUrl: imageUrl.trim(),
      source: "user",
      dietaryTags: [],
    };
    if (editing) {
      await myRecipesService.update(editing.id, data);
    } else {
      await myRecipesService.create(data);
    }
    onSaved();
    onClose();
  }

  function remove() {
    if (!editing) return;
    setMessage(null);
    // Brisanje kroz potvrdni modal — jednostavno odmah briše uz poruku
    setPasteOpen(false);
      setMessage(t("addRecipe.deleted"));
    myRecipesService.remove(editing.id).then(() => {
      onSaved();
      onClose();
    });
  }

  function applyImport() {
    const parsed = parseRecipeText(pasteText);
    if (!parsed) {
      setMessage(t("addRecipe.importNothing"));
      return;
    }
    if (parsed.name && !name.trim()) setName(parsed.name);
    if (parsed.ingredientsText) setIngredients(textToIngredients(parsed.ingredientsText));
    if (parsed.instructionsText) setInstructionsText(parsed.instructionsText);
    setPasteOpen(false);
    setPasteText("");
  }

  /** Izračunaj kcal/makroe iz sastojaka (po gramaži iz ingredient_map). */
  return (
    <AppModal
      visible={visible}
      title={editing ? t("addRecipe.titleEdit") : t("addRecipe.titleNew")}
      onClose={onClose}
      onSave={save}
      onDelete={editing ? remove : undefined}
    >
      <Text style={appModalStyles.label}>{t("addRecipe.name")}</Text>
      <TextInput style={appModalStyles.input} value={name} onChangeText={setName} />

      <Text style={appModalStyles.label}>{t("addRecipe.category")}</Text>
      <TextInput
        style={appModalStyles.input}
        value={category}
        onChangeText={setCategory}
        placeholder={t("addRecipe.categoryPlaceholder")}
        placeholderTextColor={colors.textFaint}
      />

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
            placeholder="e.g. 4"
            placeholderTextColor={colors.textFaint}
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
        value={instructionsText}
        onChangeText={setInstructionsText}
        multiline
        placeholderTextColor={colors.textFaint}
      />

      <Pressable style={styles.pasteToggle} onPress={() => setPasteOpen(!pasteOpen)}>
        <Text style={styles.pasteToggleText}>
          {pasteOpen ? t("addRecipe.pasteHide") : t("addRecipe.paste")}
        </Text>
      </Pressable>

      {pasteOpen && (
        <View style={styles.pasteBox}>
          <Text style={appModalStyles.label}>{t("addRecipe.pasteLabel")}</Text>
          <TextInput
            style={[appModalStyles.input, appModalStyles.multiline, styles.pasteInput]}
            value={pasteText}
            onChangeText={setPasteText}
            multiline
            placeholder={t("addRecipe.pastePlaceholder")}
            placeholderTextColor={colors.textFaint}
          />
          <Pressable style={styles.pasteImport} onPress={applyImport}>
            <Text style={styles.pasteImportText}>{t("addRecipe.import")}</Text>
          </Pressable>
        </View>
      )}

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
  pasteToggle: { marginTop: 14, alignSelf: "flex-start" },
  pasteToggleText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  pasteBox: { marginTop: 12 },
  pasteInput: { minHeight: 100, marginTop: 6 },
  pasteImport: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  pasteImportText: { color: "#fff", fontWeight: "700" },
});
