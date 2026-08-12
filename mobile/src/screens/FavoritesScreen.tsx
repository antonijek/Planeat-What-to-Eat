import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { ScreenMenu } from "../components/ScreenMenu";
import { RecipeCard } from "../components/RecipeCard";
import { useUserStore } from "../store/userStore";
import { recipeService } from "../services/recipeService";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const { favorites } = useUserStore();
  const recipes = favorites
    .map((f) => recipeService.getById(f.recipeId))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <Screen scroll={false}>
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
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
          <RecipeCard recipe={item} onPress={() => nav.navigate("RecipeDetail", { id: item.id })} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8 },
  empty: { color: colors.textMuted, fontSize: 15, marginTop: 24, textAlign: "center" },
});
