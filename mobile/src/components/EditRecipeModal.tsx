import React, { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { Recipe } from "../types";
import { overrideService } from "../services/overrideService";
import { ingredientsToText, textToIngredients, textToLines } from "../utils/ingredients";
import { AppModal, appModalStyles } from "./AppModal";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  recipe: Recipe;
  onClose: () => void;
  onSaved: () => void;
}

export function EditRecipeModal({ visible, recipe, onClose, onSaved }: Props) {
  const [name, setName] = useState(recipe.name);
  const [category, setCategory] = useState(recipe.category);
  const [prepTime, setPrepTime] = useState(String(recipe.prepTime));
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (visible) {
      setName(recipe.name);
      setCategory(recipe.category);
      setPrepTime(String(recipe.prepTime));
      setIngredients(ingredientsToText(recipe.ingredients));
      setInstructions(recipe.instructions.join("\n"));
    }
  }, [visible, recipe]);

  async function save() {
    await overrideService.update(recipe.id, {
      name: name.trim() || undefined,
      category: category.trim() || undefined,
      prepTime: parseInt(prepTime) || recipe.prepTime,
      ingredients: textToIngredients(ingredients),
      instructions: textToLines(instructions),
    });
    onSaved();
    onClose();
  }

  return (
    <AppModal
      visible={visible}
      title="Edit recipe"
      onClose={onClose}
      onSave={save}
      saveLabel="Save changes"
    >
      <Text style={appModalStyles.label}>Name</Text>
      <TextInput style={appModalStyles.input} value={name} onChangeText={setName} />

      <Text style={appModalStyles.label}>Category</Text>
      <TextInput style={appModalStyles.input} value={category} onChangeText={setCategory} />

      <Text style={appModalStyles.label}>Prep time (min)</Text>
      <TextInput
        style={appModalStyles.input}
        value={prepTime}
        onChangeText={setPrepTime}
        keyboardType="numeric"
      />

      <Text style={appModalStyles.label}>
        Ingredients (one per line: name | amount | unit)
      </Text>
      <TextInput
        style={[appModalStyles.input, appModalStyles.multiline]}
        value={ingredients}
        onChangeText={setIngredients}
        multiline
        placeholder="chicken | 2 | pcs&#10;rice | 200 | g"
        placeholderTextColor={colors.textFaint}
      />

      <Text style={appModalStyles.label}>Instructions (one step per line)</Text>
      <TextInput
        style={[appModalStyles.input, appModalStyles.multiline]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholder="Wash the meat..."
        placeholderTextColor={colors.textFaint}
      />
    </AppModal>
  );
}
