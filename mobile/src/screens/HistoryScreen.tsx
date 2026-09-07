import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Image, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { historyService, CookedDay } from "../services/historyService";
import { useUserStore } from "../store/userStore";
import { isFeatureUnlocked } from "../services/premiumService";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors } from "../constants/theme";
import { PremiumLockScreen } from "../components/PremiumLockScreen";
import { useTranslatedRecipe } from "../utils/useTranslatedRecipe";
import { Screen } from "../components/Screen";
import { AppModal } from "../components/AppModal";
import { lightColors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function dayLabel(day: string, t: (key: string, opts?: Record<string, unknown>) => string, lang: string): string {
  const today = new Date();
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayKey = toKey(today);
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const yestKey = toKey(yest);
  if (day === todayKey) return t("tracker.today");
  if (day === yestKey) return t("tracker.yesterday");
  return new Date(day + "T00:00:00").toLocaleDateString(lang);
}

export function HistoryScreen() {
  const nav = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { recipeName } = useTranslatedRecipe();
  const { isPremium, trialActive } = useUserStore();
  const [days, setDays] = useState<CookedDay[]>([]);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    historyService.getCookedGroupedByDay().then(setDays);
  }, []);

  useFocusEffect(
    useCallback(() => {
      historyService.getCookedGroupedByDay().then(setDays);
    }, [])
  );

  if (!isFeatureUnlocked("history", isPremium, trialActive)) {
    return (
      <PremiumLockScreen
        emoji="🥘"
        title={t("history.premiumTitle")}
        description={t("history.premiumDesc")}
      />
    );
  }

  return (
    <Screen scroll={false} edges={["bottom", "left", "right"]}>
      <FlatList
        data={days}
        keyExtractor={(d) => d.dateKey}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t("history.title")}</Text>
            {days.length > 0 && (
              <Pressable onPress={() => setClearConfirmOpen(true)}>
                <Text style={styles.clearBtn}>{t("history.clear")}</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{t("history.empty")}</Text>
            <Pressable
              style={styles.browseBtn}
              onPress={() => (nav.navigate as (...args: unknown[]) => void)("Home", { screen: "RecipesTab" })}
            >
              <Text style={styles.browseBtnText}>{t("history.browseRecipes")}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{dayLabel(item.day, t, i18n.language)}</Text>
            {item.items.map((c) => (
              <Pressable
                key={c.recipeId + c.time}
                style={styles.row}
                onPress={() => nav.navigate("RecipeDetail", { id: c.recipeId })}
              >
                {c.imageUrl ? (
                  <Image source={{ uri: c.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {recipeName(c.recipeId, c.name)}
                    </Text>
                  <Text style={styles.rowSub}>{t("history.cookedAt", { time: c.time })}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      />

      <AppModal
        visible={clearConfirmOpen}
        title={t("history.clearConfirmTitle")}
        onClose={() => setClearConfirmOpen(false)}
        onCancel={() => setClearConfirmOpen(false)}
        onSave={async () => {
          await historyService.clearCooked();
          setDays([]);
          setClearConfirmOpen(false);
        }}
        saveLabel={t("common.delete")}
      >
        <Text style={{ color: lightColors.text }}>{t("history.clearConfirmText")}</Text>
      </AppModal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background, paddingTop: 12 },
    content: { padding: 16, paddingBottom: 40 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    title: { fontSize: 24, fontWeight: "800", color: colors.text },
    clearBtn: { color: colors.danger, fontWeight: "600" },
    section: { marginBottom: 16 },
    sectionLabel: { fontSize: 16, fontWeight: "700", color: colors.textMuted, marginBottom: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
    },
    thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.imageBg },
    thumbPlaceholder: { backgroundColor: colors.placeholderBg },
    rowBody: { flex: 1, marginLeft: 12 },
    rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
    rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    empty: { color: colors.textMuted, fontSize: 15, marginTop: 24, textAlign: "center", lineHeight: 22 },
    emptyWrap: { alignItems: "center" },
    browseBtn: {
      marginTop: 16,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    browseBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  });
