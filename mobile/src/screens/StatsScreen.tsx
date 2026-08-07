import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { historyService } from "../services/historyService";
import { recipeService } from "../services/recipeService";
import { useUserStore } from "../store/userStore";
import { useTranslation } from "react-i18next";
import { colors } from "../constants/theme";
import { PremiumLockScreen } from "../components/PremiumLockScreen";

interface RankItem {
  name: string;
  count: number;
  kcal?: number;
  protein?: number;
}

export function StatsScreen() {
  const { t } = useTranslation();
  const { isPremium } = useUserStore();
  const [totalCooked, setTotalCooked] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [avgKcal, setAvgKcal] = useState(0);
  const [avgProtein, setAvgProtein] = useState(0);
  const [sumSugar, setSumSugar] = useState(0);
  const [top, setTop] = useState<RankItem[]>([]);
  const [topCategories, setTopCategories] = useState<RankItem[]>([]);

  useEffect(() => {
    if (!isPremium) return;
    (async () => {
      const entries = await historyService.getCooked();
      if (entries.length === 0) {
        setTotalCooked(0);
        setThisWeek(0);
        setAvgKcal(0);
        setAvgProtein(0);
        setSumSugar(0);
        setTop([]);
        setTopCategories([]);
        return;
      }

      const now = Date.now();
      const weekAgo = now - 7 * 24 * 3600 * 1000;
      const catCount = new Map<string, number>();
      const recCount = new Map<string, number>();
      let kcalSum = 0;
      let protSum = 0;
      let sugarSum = 0;
      let week = 0;

      for (const e of entries) {
        const r = recipeService.getById(e.recipeId);
        if (r) {
          const per = r.servings || 1;
          const kcalP = r.calories ? r.calories / per : 0;
          const protP = r.protein ? r.protein / per : 0;
          const sugP = r.addedSugar ? r.addedSugar / per : 0;
          kcalSum += kcalP;
          protSum += protP;
          sugarSum += sugP;
          catCount.set(r.category, (catCount.get(r.category) ?? 0) + 1);
          recCount.set(r.name, (recCount.get(r.name) ?? 0) + 1);
        }
        if (new Date(e.cookedAt).getTime() >= weekAgo) week++;
      }

      setTotalCooked(entries.length);
      setThisWeek(week);
      setAvgKcal(Math.round(kcalSum / entries.length));
      setAvgProtein(Math.round(protSum / entries.length));
      setSumSugar(Math.round(sugarSum));

      setTop(
        Array.from(recCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      );
      setTopCategories(
        Array.from(catCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      );
    })();
  }, [isPremium]);

  if (!isPremium) {
    return (
      <PremiumLockScreen
        emoji="📊"
        title={t("stats.premiumTitle")}
        description={t("stats.premiumDesc")}
      />
    );
  }

  const statCards = [
    { label: t("stats.mealsCooked"), value: String(totalCooked) },
    { label: t("stats.thisWeek"), value: String(thisWeek) },
    { label: t("stats.avgKcal"), value: avgKcal ? `~${avgKcal}` : "—" },
    { label: t("stats.avgProtein"), value: avgProtein ? `~${avgProtein}g` : "—" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("stats.title")}</Text>

        <View style={styles.cardsRow}>
          {statCards.map((c) => (
            <View key={c.label} style={styles.card}>
              <Text style={styles.cardValue}>{c.value}</Text>
              <Text style={styles.cardLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {t("stats.totalSugar", { count: sumSugar })}
          </Text>
        </View>

        <Text style={styles.section}>{t("stats.mostCooked")}</Text>
        {top.length === 0 ? (
          <Text style={styles.empty}>{t("stats.noData")}</Text>
        ) : (
          top.map((t, i) => (
            <View key={t.name} style={styles.listRow}>
              <Text style={styles.rank}>{i + 1}.</Text>
              <Text style={styles.listName} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={styles.listCount}>{t.count}×</Text>
            </View>
          ))
        )}

        <Text style={styles.section}>{t("stats.topCategories")}</Text>
        {topCategories.length === 0 ? (
          <Text style={styles.empty}>{t("stats.noData")}</Text>
        ) : (
          topCategories.map((c, i) => (
            <View key={c.name} style={styles.listRow}>
              <Text style={styles.rank}>{i + 1}.</Text>
              <Text style={styles.listName} numberOfLines={1}>
                {c.name}
              </Text>
              <Text style={styles.listCount}>{c.count}×</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  card: {
    flex: 1,
    minWidth: 90,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  cardValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  cardLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: "center" },
  banner: {
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
  },
  bannerText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  section: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 24, marginBottom: 8 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  rank: { width: 24, color: colors.primary, fontWeight: "700" },
  listName: { flex: 1, fontSize: 14, color: colors.text },
  listCount: { color: colors.textMuted, fontWeight: "600" },
  empty: { color: colors.textMuted, marginTop: 6 },
});
