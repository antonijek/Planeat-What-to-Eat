import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useShoppingStore } from "../store/shoppingStore";
import { useUserStore } from "../store/userStore";
import { planService } from "../services/planService";
import { isFeatureUnlocked } from "../services/premiumService";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";
import { PremiumLockScreen } from "../components/PremiumLockScreen";
import { ScreenMenu } from "../components/ScreenMenu";
import { useTranslatedRecipe } from "../utils/useTranslatedRecipe";
import { Screen } from "../components/Screen";

export function ShoppingScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { ingredient: ingredientLabel } = useTranslatedRecipe();
  const { items, load, toggle, remove, addManual, replaceMany, clearChecked } = useShoppingStore();
  const { isPremium, trialActive } = useUserStore();
  const [name, setName] = useState("");
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  if (!isFeatureUnlocked("shopping", isPremium, trialActive)) {
    return (
      <PremiumLockScreen
        emoji="🛒"
        title={t("shopping.title")}
        description={t("shopping.premiumDesc")}
      />
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{t("shopping.title")}</Text>
                <ScreenMenu navigate={nav.navigate} />
              </View>
              <View style={styles.planRow}>
                <Pressable
                  style={styles.planBtn}
                  onPress={async () => {
                    const ingredients = await planService.getShoppingIngredients();
                    if (ingredients.length === 0) {
                      setInfo(t("shopping.planEmpty"));
                      return;
                    }
                    await replaceMany(
                      ingredients.map((i) => ({
                        id: `auto-${i.name}-${Date.now()}`,
                        name: i.name,
                        amount: i.amount,
                        unit: i.unit,
                        category: "Other",
                        isManual: false,
                        isChecked: false,
                        sourceRecipeIds: [],
                      }))
                    );
                    setInfo(t("shopping.addedFromPlan", { count: ingredients.length }));
                  }}
                >
                  <Text style={styles.planBtnText}>{t("shopping.fromPlanner")}</Text>
                </Pressable>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={t("shopping.addPlaceholder")}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={colors.textFaint}
                />
                <Pressable
                  style={styles.addBtn}
                  onPress={() => {
                    if (!name.trim()) return;
                    addManual({ name: name.trim(), amount: 1, unit: "kom", category: "Other" });
                    setName("");
                  }}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </Pressable>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summary}>
                  {items.filter((i) => i.isChecked).length}/{items.length} {t("shopping.done")}
                </Text>
                <Pressable onPress={clearChecked}>
                  <Text style={styles.clearBtn}>{t("shopping.clearChecked")}</Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, item.isChecked && styles.itemDone]}
              onPress={() => toggle(item.id)}
              onLongPress={() => remove(item.id)}
            >
              <View style={styles.check}>
                <Text style={styles.checkText}>{item.isChecked ? "✓" : ""}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={2}>
                {ingredientLabel(item.name)}
              </Text>
              {item.amount > 0 && (
                <Text style={styles.itemAmount}>
                  {item.amount} {item.unit}
                </Text>
              )}
            </Pressable>
          )}
        />

      {info != null && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setInfo(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalIcon}>🛒</Text>
              <Text style={styles.modalText}>{info}</Text>
              <Pressable style={styles.modalBtn} onPress={() => setInfo(null)}>
                <Text style={styles.modalBtnText}>{t("common.ok")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingTop: 12 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  planBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  planBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  inputRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 26, lineHeight: 30 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  summary: { color: colors.textMuted, fontSize: 13 },
  clearBtn: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  itemDone: { opacity: 0.6 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: colors.primary, fontWeight: "700" },
  itemName: { flex: 1, color: colors.text, fontSize: 15 },
  itemNameDone: { textDecorationLine: "line-through" },
  itemAmount: { color: colors.textMuted, fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalIcon: { fontSize: 40, marginBottom: 12 },
  modalText: { fontSize: 15, color: colors.text, textAlign: "center", lineHeight: 22 },
  modalBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
