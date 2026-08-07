import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Wheel } from "../components/Wheel";
import { useRecipeStore } from "../store/recipeStore";
import { useUserStore } from "../store/userStore";
import { historyService } from "../services/historyService";
import { premiumService } from "../services/premiumService";
import { recipeService } from "../services/recipeService";
import { MealMomentPicker } from "../components/MealMomentPicker";
import { WheelResultModal } from "../components/WheelResultModal";
import { recipesForMoment } from "../constants/mealMoments";
import { Recipe } from "../types";
import { parseIngredientInput } from "../utils/ingredients";
import { IngredientInputChips } from "../components/IngredientInputChips";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { recipes, load, lastSpunRecipeId } = useRecipeStore();
  const { isPremium } = useUserStore();
  const [spinsLeft, setSpinsLeft] = useState<number | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [moment, setMoment] = useState<string | null>(null);
  const [result, setResult] = useState<Recipe | null>(null);
  const [haveIngredients, setHaveIngredients] = useState<string[]>([]);
  const [haveInput, setHaveInput] = useState("");

  const filteredRecipes = useMemo(() => {
    let list = recipesForMoment(recipes, moment) as Recipe[];
    // filter po čipovima (bez "live" teksta)
    if (haveIngredients.length > 0) {
      list = recipeService.findByIngredients(haveIngredients) as Recipe[];
      if (moment) {
        const momentSet = new Set((recipesForMoment(recipes, moment) as Recipe[]).map((r) => r.id));
        list = list.filter((r) => momentSet.has(r.id));
      }
    }
    return list;
  }, [recipes, moment, haveIngredients]);

  function addHave() {
    const parts = parseIngredientInput(haveInput);
    if (parts.length === 0) return;
    const next = [...haveIngredients];
    for (const p of parts) {
      if (!next.includes(p)) next.push(p);
    }
    setHaveIngredients(next);
    setHaveInput("");
  }

  useEffect(() => {
    load();
    refreshSpins();
  }, [load]);

  async function refreshSpins() {
    const remaining = await premiumService.remainingSpinsToday();
    setSpinsLeft(remaining);
  }

  function handleSpinEnd(recipe: Recipe) {
    historyService.record(recipe.id);
    premiumService.consumeSpin();
    setSpinCount((c) => c + 1);
    refreshSpins();
    setResult(recipe);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>
                What should I eat today?
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                Spin the wheel and discover a meal
              </Text>
            </View>
            <Text style={styles.spinCount}>{spinCount}× 🎡</Text>
          </View>

          <View style={styles.haveWrap}>
            <Pressable
              onPress={() => setHaveIngredients([])}
              hitSlop={8}
              style={styles.haveHead}
            >
              <Text style={styles.haveHeadText}>
                🥘 What do I have at home?{haveIngredients.length > 0 ? ` (${haveIngredients.length})` : ""}
              </Text>
            </Pressable>
            <IngredientInputChips
              value={haveInput}
              onChangeText={setHaveInput}
              onSubmit={addHave}
              ingredients={haveIngredients}
              onRemove={(ing) => setHaveIngredients(haveIngredients.filter((i) => i !== ing))}
              placeholder="e.g. chicken, rice..."
              emptyHint="1. Type an ingredient → 2. Press + → 3. Spin"
              hint={
                haveIngredients.length > 0
                  ? `🎡 ${filteredRecipes.length} recipe${
                      filteredRecipes.length === 1 ? "" : "s"
                    } available with: ${haveIngredients.join(", ")}`
                  : undefined
              }
            />
          </View>
        </View>

        <View style={styles.wheelArea}>
          <Wheel
            recipes={filteredRecipes}
            onSpinEnd={(r) => handleSpinEnd(r)}
            disabled={!isPremium && spinsLeft === 0}
          />
        </View>

        <View style={styles.bottomArea}>
          <MealMomentPicker selected={moment} onSelect={setMoment} />

          {filteredRecipes.length === 0 && (
            <Text style={styles.limit}>No recipes in this category.</Text>
          )}

          {!isPremium && spinsLeft !== null && (
            <Text style={styles.limit}>
              Spins left today: {spinsLeft}
            </Text>
          )}

          {lastSpunRecipeId ? (
            <Pressable
              onPress={() => nav.navigate("RecipeDetail", { id: lastSpunRecipeId })}
              style={styles.last}
            >
              <Text style={styles.lastText}>👀 See the last pick</Text>
            </Pressable>
          ) : null}

          <View style={styles.shortcuts}>
            <Pressable style={styles.shortcut} onPress={() => nav.navigate("CalorieLog")}>
              <MaterialCommunityIcons name="food-apple-outline" size={26} color={colors.primary} />
              <Text style={styles.shortcutLabel}>Calorie tracker</Text>
            </Pressable>
            <Pressable style={styles.shortcut} onPress={() => nav.navigate("MyRecipes")}>
              <MaterialCommunityIcons name="chef-hat" size={26} color={colors.primary} />
              <Text style={styles.shortcutLabel}>My recipes</Text>
            </Pressable>
            <Pressable style={styles.shortcut} onPress={() => nav.navigate("Planer")}>
              <MaterialCommunityIcons name="calendar-month" size={26} color={colors.primary} />
              <Text style={styles.shortcutLabel}>Planer</Text>
            </Pressable>
            <Pressable style={styles.shortcut} onPress={() => nav.navigate("History")}>
              <MaterialCommunityIcons name="history" size={26} color={colors.primary} />
              <Text style={styles.shortcutLabel}>Cooked</Text>
            </Pressable>
            <Pressable style={styles.shortcut} onPress={() => nav.navigate("Stats")}>
              <MaterialCommunityIcons name="chart-bar" size={26} color={colors.primary} />
              <Text style={styles.shortcutLabel}>Stats</Text>
            </Pressable>
            <Pressable style={styles.shortcut} onPress={() => nav.navigate("About")}>
              <MaterialCommunityIcons name="information-outline" size={26} color={colors.primary} />
              <Text style={styles.shortcutLabel}>About</Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>

      <WheelResultModal
        recipe={result}
        onView={() => {
          if (result) nav.navigate("RecipeDetail", { id: result.id });
          setResult(null);
        }}
        onSpinAgain={() => setResult(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 16, paddingTop: 28 },
  header: { marginBottom: 8 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  spinCount: { fontSize: 13, fontWeight: "600", color: colors.primary },
  wheelArea: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  bottomArea: { alignItems: "center", paddingBottom: 8 },
  limit: { marginTop: 12, color: colors.textMuted, fontSize: 13 },
  last: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  lastText: { color: colors.primary, fontWeight: "600" },
  haveWrap: {
    width: "100%",
    marginTop: 14,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 12,
  },
  haveHead: { alignItems: "center", paddingVertical: 2 },
  haveHeadText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  haveInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  haveAdd: {
    width: 40,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  haveAddText: { color: "#fff", fontSize: 22, lineHeight: 26 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  haveHint: { color: colors.textMuted, fontSize: 12, marginTop: 8, textAlign: "center" },
  haveGuide: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  shortcuts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 16,
    alignSelf: "stretch",
  },
  shortcut: {
    width: 86,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 4 },
});
