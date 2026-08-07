import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { planService } from "../services/planService";
import { recipeService } from "../services/recipeService";
import { useUserStore } from "../store/userStore";
import { MealPlanEntry } from "../types";
import { colors } from "../constants/theme";
import { PremiumLockScreen } from "../components/PremiumLockScreen";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES: { key: "lunch" | "dinner"; label: string }[] = [
  { key: "lunch", label: "🍳 Lunch" },
  { key: "dinner", label: "🍽️ Dinner" },
];

export function PlanerScreen() {
  const nav = useNavigation<Nav>();
  const { isPremium } = useUserStore();
  const [plan, setPlan] = useState<MealPlanEntry[]>([]);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [pickerMeal, setPickerMeal] = useState<"lunch" | "dinner" | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    planService.getPlan().then(setPlan);
  }, []);

  async function reload() {
    setPlan(await planService.getPlan());
  }

  const recipes = recipeService
    .search(search.trim())
    .sort((a, b) => a.name.localeCompare(b.name));

  const summary = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let sugar = 0;
    let meals = 0;
    for (const entry of plan) {
      const r = recipeService.getById(entry.recipeId);
      if (!r) continue;
      const per = r.servings || 1;
      const mult = entry.persons / per;
      kcal += (r.calories ?? 0) * mult;
      protein += (r.protein ?? 0) * mult;
      fat += (r.fats ?? 0) * mult;
      carbs += (r.carbs ?? 0) * mult;
      sugar += ((r.addedSugar ?? r.sugars) ?? 0) * mult;
      meals++;
    }
    return { kcal, protein, fat, carbs, sugar, meals };
  }, [plan]);

  if (!isPremium) {
    return (
      <PremiumLockScreen
        emoji="📅"
        title="Meal Planer"
        description="Premium feature. Plan your meals for the whole week."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={DAYS}
        keyExtractor={(d, i) => String(i)}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Meal Planer</Text>
            </View>
            {summary.meals > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  Week total ({summary.meals} meals)
                </Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      ~{summary.kcal.toLocaleString()} kcal
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      ~{summary.protein.toLocaleString()}g protein
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>~{summary.fat.toLocaleString()}g fat</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      ~{summary.carbs.toLocaleString()}g carbs
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      ~{summary.sugar.toLocaleString()}g sugar
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.content}
        renderItem={({ item, index }) => (
          <View style={styles.dayCard}>
            <Text style={styles.dayTitle}>{item}</Text>
            {MEAL_TYPES.map((meal) => {
              const entry = plan.find(
                (p) => p.dayOfWeek === index && p.mealType === meal.key
              );
              const recipe = entry ? recipeService.getById(entry.recipeId) : undefined;
              return (
                <Pressable
                  key={meal.key}
                  style={styles.mealRow}
                  onPress={() => {
                    setPickerDay(index);
                    setPickerMeal(meal.key);
                  }}
                >
                  <Text style={styles.mealLabel}>{meal.label}</Text>
                  {entry && recipe ? (
                    <View style={styles.mealAssigned}>
                      <Text style={styles.mealRecipeName} numberOfLines={1}>
                        {recipe.name}
                      </Text>
                      <Text style={styles.mealPersons}>{entry.persons} pers.</Text>
                      <Pressable
                        onPress={async () => {
                          await planService.remove(index, meal.key);
                          reload();
                        }}
                        hitSlop={8}
                      >
                        <Text style={styles.removeText}>✕</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.mealEmpty}>+ assign recipe</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      />

      <Modal
        visible={pickerDay !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerDay(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {DAYS[pickerDay ?? 0]} · {MEAL_TYPES.find((m) => m.key === pickerMeal)?.label}
            </Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipe..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.textFaint}
            />
            <FlatList
              data={recipes}
              keyExtractor={(r) => r.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.recipeRow}
                  onPress={async () => {
                    const entry: MealPlanEntry = {
                      id: `${pickerDay}-${pickerMeal}`,
                      dayOfWeek: pickerDay!,
                      mealType: pickerMeal!,
                      recipeId: item.id,
                      persons: 2,
                    };
                    setPlan(await planService.upsert(entry));
                    setPickerDay(null);
                  }}
                >
                  <Text style={styles.recipeRowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.recipeRowMeta}>{item.prepTime} min</Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.cancelBtn} onPress={() => setPickerDay(null)}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: { color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 10 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryStat: { flexBasis: "46%", flexGrow: 1 },
  summaryValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  dayTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8 },
  mealRow: {
    borderTopColor: colors.border,
    borderTopWidth: 0.5,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealLabel: { fontSize: 14, color: colors.textMuted, width: 90 },
  mealAssigned: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealRecipeName: { flex: 1, color: colors.text, fontWeight: "600" },
  mealPersons: { color: colors.textMuted, fontSize: 12 },
  removeText: { color: colors.danger, fontSize: 18 },
  mealEmpty: { color: colors.primary, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  recipeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomColor: colors.border,
    borderBottomWidth: 0.5,
  },
  recipeRowName: { flex: 1, color: colors.text, fontSize: 15 },
  recipeRowMeta: { color: colors.textMuted, fontSize: 13 },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: { color: colors.text, fontWeight: "600" },
});
