import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { RecipeCard } from "../components/RecipeCard";
import { AddRecipeModal } from "../components/AddRecipeModal";
import { myRecipesService } from "../services/myRecipesService";
import { useUserStore } from "../store/userStore";
import { isFeatureUnlocked } from "../services/premiumService";
import { Recipe } from "../types";
import { useTheme, ThemeColors, lightColors } from "../constants/theme";
import { PremiumLockScreen } from "../components/PremiumLockScreen";
import { AppModal } from "../components/AppModal";
import { useTranslation } from "react-i18next";
import { Screen } from "../components/Screen";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MyRecipesScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPremium, trialActive } = useUserStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);

  const reload = useCallback(() => {
    myRecipesService.getAll().then(setRecipes);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [recipes, query]);

  function confirmDelete(r: Recipe) {
    setDeleteTarget(r);
  }

  async function doDelete() {
    if (!deleteTarget) return;
    await myRecipesService.remove(deleteTarget.id);
    setDeleteTarget(null);
    reload();
  }

  if (!isFeatureUnlocked("myRecipes", isPremium, trialActive)) {
    return (
      <PremiumLockScreen
        emoji="👨‍🍳"
        title={t("myRecipes.premiumTitle")}
        description={t("myRecipes.premiumDesc")}
      />
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t("myRecipes.title", { count: filtered.length })}</Text>
              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  setEditing(null);
                  setAddOpen(true);
                }}
              >
                <Text style={styles.addBtnText}>{t("myRecipes.add")}</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder={t("myRecipes.searchPlaceholder")}
              placeholderTextColor={colors.textFaint}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.trim() ? t("myRecipes.emptySearch") : t("myRecipes.empty")}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <RecipeCard
              recipe={item}
              onPress={() => nav.navigate("RecipeDetail", { id: item.id })}
            />
            <View style={styles.rowActions}>
              <Pressable
                style={styles.actionBtn}
                hitSlop={8}
                onPress={() => {
                  setEditing(item);
                  setAddOpen(true);
                }}
              >
                <Text style={styles.actionText}>✏️</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                hitSlop={8}
                onPress={() => confirmDelete(item)}
              >
                <Text style={styles.actionText}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <AddRecipeModal
        visible={addOpen}
        editing={editing}
        onClose={() => setAddOpen(false)}
        onSaved={reload}
      />

      <AppModal
        visible={deleteTarget !== null}
        title={t("myRecipes.deleteTitle")}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onSave={doDelete}
        saveLabel={t("myRecipes.delete")}
      >
        <Text style={{ color: lightColors.text }}>
          {t("myRecipes.deleteConfirm", { name: deleteTarget?.name ?? "" })}
        </Text>
      </AppModal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, paddingTop: 12 },
  content: { padding: 16, paddingBottom: 60 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  search: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: 6,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  empty: { color: colors.textMuted, fontSize: 15, marginTop: 24, textAlign: "center" },
  rowWrap: { position: "relative" },
  cardPress: {},
  rowActions: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontSize: 15 },
  });
