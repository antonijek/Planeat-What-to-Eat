import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { ScreenMenu } from "../components/ScreenMenu";
import { RecipeCard } from "../components/RecipeCard";
import { useUserStore } from "../store/userStore";
import { recipeService } from "../services/recipeService";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { favorites, pinFavorite, ratings } = useUserStore();

  // Omiljeni sortirani: zakačeni (pinned) prvo, pa po datumu dodavanja.
  const recipes = useMemo(() => {
    const favMap = new Map(favorites.map((f) => [f.recipeId, f]));
    const list = favorites
      .map((f) => {
        const r = recipeService.getById(f.recipeId);
        return r ? { recipe: r, pinned: f.isPinned, addedAt: f.addedAt } : null;
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.addedAt.localeCompare(a.addedAt);
    });
    return list;
  }, [favorites]);

  const pinnedCount = favorites.filter((f) => f.isPinned).length;

  return (
    <Screen scroll={false}>
      <FlatList
        data={recipes}
        keyExtractor={(x) => x.recipe.id}
        ListHeaderComponent={
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t("favorites.title", { count: recipes.length })}</Text>
            <ScreenMenu navigate={nav.navigate} />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t("favorites.empty")}</Text>
        }
        renderItem={({ item }) => (
          <View>
            <RecipeCard
              recipe={item.recipe}
              onPress={() => nav.navigate("RecipeDetail", { id: item.recipe.id })}
              rating={ratings[item.recipe.id]}
            />
            <Pressable
              style={styles.pinBtn}
              onPress={() => pinFavorite(item.recipe.id)}
              hitSlop={8}
            >
              <Text style={styles.pinText}>
                {item.pinned ? "📌 " : ""}
                {item.pinned ? t("favorites.pinned") : t("favorites.pin")}
                {!item.pinned && pinnedCount >= 5 ? ` (${t("favorites.max")})` : ""}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8 },
    empty: { color: colors.textMuted, fontSize: 15, marginTop: 24, textAlign: "center" },
    pinBtn: { alignSelf: "flex-start", marginTop: -6, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 4 },
    pinText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  });
