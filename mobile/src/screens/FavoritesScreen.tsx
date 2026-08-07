import React from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
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
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={<Text style={styles.title}>{t("favorites.title", { count: recipes.length })}</Text>}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("favorites.empty")}</Text>
        }
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => nav.navigate("RecipeDetail", { id: item.id })} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 8 },
  empty: { color: colors.textMuted, fontSize: 15, marginTop: 24, textAlign: "center" },
});
