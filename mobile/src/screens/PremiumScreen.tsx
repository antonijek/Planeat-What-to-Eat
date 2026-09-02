import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../store/userStore";
import { Screen } from "../components/Screen";
import { useTheme, ThemeColors } from "../constants/theme";
import { usePremiumPurchase } from "../utils/usePremiumPurchase";

export function PremiumScreen() {
  const nav = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPremium, trialActive, trialDaysLeft } = useUserStore();
  const { products, purchasing, restoring, error, buy, restore } = usePremiumPurchase();
  const priceFor = (id: "monthly" | "yearly" | "lifetime") =>
    products.find((p) => p.id === id)?.price ?? "";

  useEffect(() => {
    if (error) Alert.alert(t("premium.purchaseErrorTitle"), error);
  }, [error, t]);

  const features = [
    "premium.pfUnlimited",
    "premium.pfHave",
    "premium.pfFilters",
    "premium.pfRecipes",
    "premium.pfPlaner",
    "premium.pfShopping",
    "premium.pfCalorie",
    "premium.pfStats",
    "premium.pfTheme",
  ];

  if (isPremium) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>💎</Text>
          <Text style={styles.doneTitle}>{t("premium.alreadyPremium")}</Text>
          <Text style={styles.doneText}>{t("premium.enjoy")}</Text>
          <Pressable onPress={() => nav.goBack()}>
            <Text style={styles.doneBack}>{t("premium.back")}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={colors.primary} contentStyle={styles.screenContent}>
      <View style={styles.content}>
        <Text style={styles.badge}>{t("premium.badge")}</Text>
        <Text style={styles.title}>{t("premium.title")}</Text>
        <Text style={styles.subtitle}>{t("premium.subtitle")}</Text>

        {trialActive && (
          <View style={styles.trialBanner}>
            <Text style={styles.trialBannerText}>
              {t("premium.trialActive", { count: trialDaysLeft })}
            </Text>
          </View>
        )}

        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>{t(f)}</Text>
          </View>
        ))}

        <Pressable
          style={styles.button}
          disabled={purchasing !== null}
          onPress={() => buy("monthly")}
        >
          {purchasing === "monthly" ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.buttonText}>{t("premium.monthly", { price: priceFor("monthly") })}</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonYearly]}
          disabled={purchasing !== null}
          onPress={() => buy("yearly")}
        >
          {purchasing === "yearly" ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={styles.buttonText}>{t("premium.yearly", { price: priceFor("yearly") })}</Text>
              <Text style={styles.buttonBadge}>{t("premium.bestValue")}</Text>
            </>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonAlt]}
          disabled={purchasing !== null}
          onPress={() => buy("lifetime")}
        >
          {purchasing === "lifetime" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, styles.buttonTextAlt]}>{t("premium.lifetime", { price: priceFor("lifetime") })}</Text>
          )}
        </Pressable>

        <Pressable onPress={restore} disabled={restoring}>
          <Text style={styles.back}>
            {restoring ? t("premium.restoring") : t("premium.restore")}
          </Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()}>
          <Text style={styles.back}>{t("premium.back")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screenContent: { paddingTop: 0 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    color: colors.primary,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 16 },
  subtitle: { color: colors.onPrimary, fontSize: 15, marginTop: 8, marginBottom: 20 },
  trialBanner: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  trialBannerText: { color: "#fff", fontSize: 13, fontWeight: "700", textAlign: "center" },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  check: { color: colors.accent, fontWeight: "900", marginRight: 10, fontSize: 16 },
  featureText: { color: "#fff", fontSize: 15 },
  button: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  buttonYearly: { borderWidth: 2, borderColor: colors.accent },
  buttonBadge: { color: colors.primary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  buttonAlt: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#fff" },
  buttonTextAlt: { color: "#fff" },
  back: { color: colors.onPrimary, textAlign: "center", marginTop: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 12 },
  doneText: { color: colors.textMuted, marginTop: 6 },
  doneBack: { color: colors.primary, fontWeight: "700", marginTop: 24 },
  });
