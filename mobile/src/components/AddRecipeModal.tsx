import React, { useEffect, useState } from "react";
import { Text, TextInput, Pressable, View, StyleSheet, ScrollView } from "react-native";
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

const DIFFICULTIES: Difficulty[] = ["lako", "srednje", "teško"];
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  lako: "Easy",
  srednje: "Medium",
  teško: "Hard",
};

export function AddRecipeModal({ visible, editing, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Ostalo");
  const [prepTime, setPrepTime] = useState("30");
  const [difficulty, setDifficulty] = useState<Difficulty>("srednje");
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
      setCategory(editing?.category ?? "Ostalo");
      setPrepTime(String(editing?.prepTime ?? 30));
      setDifficulty(editing?.difficulty ?? "srednje");
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
      setMessage("Name is required.");
      return;
    }
    const data = {
      name: name.trim(),
      category: category.trim() || "Ostalo",
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
    setMessage("Deleted.");
    myRecipesService.remove(editing.id).then(() => {
      onSaved();
      onClose();
    });
  }

  function applyImport() {
    const parsed = parseRecipeText(pasteText);
    if (!parsed) {
      setMessage("Nothing to import. Paste a recipe text, then tap Import.");
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
      title={editing ? "Edit recipe" : "New recipe"}
      onClose={onClose}
      onSave={save}
      onDelete={editing ? remove : undefined}
    >
      <Text style={appModalStyles.label}>Name *</Text>
      <TextInput style={appModalStyles.input} value={name} onChangeText={setName} />

      <Text style={appModalStyles.label}>Category</Text>
      <TextInput
        style={appModalStyles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="E.g. Balkan, Italian..."
        placeholderTextColor={colors.textFaint}
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>Time (min)</Text>
          <TextInput
            style={appModalStyles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>Servings</Text>
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
          <Text style={appModalStyles.label}>Calories</Text>
          <TextInput
            style={appModalStyles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>Protein (g)</Text>
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
          <Text style={appModalStyles.label}>Carbs (g)</Text>
          <TextInput
            style={appModalStyles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Text style={appModalStyles.label}>Fat (g)</Text>
          <TextInput
            style={appModalStyles.input}
            value={fats}
            onChangeText={setFats}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={appModalStyles.label}>Difficulty</Text>
      <View style={styles.diffRow}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
              {DIFFICULTY_LABELS[d]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={appModalStyles.label}>Image URL (optional)</Text>
      <TextInput
        style={appModalStyles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://..."
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
      />

      <Text style={appModalStyles.label}>Instructions (one step per line)</Text>
      <TextInput
        style={[appModalStyles.input, appModalStyles.multiline]}
        value={instructionsText}
        onChangeText={setInstructionsText}
        multiline
        placeholderTextColor={colors.textFaint}
      />

      <Pressable style={styles.pasteToggle} onPress={() => setPasteOpen(!pasteOpen)}>
        <Text style={styles.pasteToggleText}>
          {pasteOpen ? "✕ Hide import" : "📋 Paste a recipe"}
        </Text>
      </Pressable>

      {pasteOpen && (
        <View style={styles.pasteBox}>
          <Text style={appModalStyles.label}>Paste recipe text</Text>
          <TextInput
            style={[appModalStyles.input, appModalStyles.multiline, styles.pasteInput]}
            value={pasteText}
            onChangeText={setPasteText}
            multiline
            placeholder={"Ingredients:\n2 cups chicken\n1 onion\n\nInstructions:\n1. Cut..."}
            placeholderTextColor={colors.textFaint}
          />
          <Pressable style={styles.pasteImport} onPress={applyImport}>
            <Text style={styles.pasteImportText}>⬇️ Import</Text>
          </Pressable>
        </View>
      )}

      <AppModal
        visible={message !== null}
        title="Heads up"
        onClose={() => setMessage(null)}
        onSave={() => setMessage(null)}
        saveLabel="OK"
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
