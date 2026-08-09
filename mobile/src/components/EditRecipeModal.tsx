import React, { useEffect, useState } from "react";
import { Text, TextInput, View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Recipe } from "../types";
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

export function EditRecipeModal({ visible, recipe, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(recipe.name);
  const [category, setCategory] = useState(recipe.category);
  const [prepTime, setPrepTime] = useState(String(recipe.prepTime));
  const [ingredients, setIngredients] = useState(recipe.ingredients);
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(recipe.name);
      setCategory(recipe.category);
      setPrepTime(String(recipe.prepTime));
      setIngredients(recipe.ingredients);
      setInstructions(recipe.instructions.join("\n"));
      setMessage(null);
    }
  }, [visible, recipe]);

  async function save() {
    await overrideService.update(recipe.id, {
      name: name.trim() || undefined,
      category: category.trim() || undefined,
      prepTime: parseInt(prepTime) || recipe.prepTime,
      ingredients,
      instructions: textToLines(instructions),
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
      </View>

      <IngredientEditor
        ingredients={ingredients}
        onChangeIngredients={setIngredients}
        onCompute={() => {}}
        onMessage={setMessage}
      />

      <Text style={appModalStyles.label}>{t("addRecipe.instructions")}</Text>
      <TextInput
        style={[appModalStyles.input, appModalStyles.multiline]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholder="Wash the meat..."
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
});
