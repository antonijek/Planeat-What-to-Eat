import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../store/userStore";
import { Screen } from "../components/Screen";
import { PREMIUM_PRICES, TRIAL_DAYS } from "../services/premiumService";
import { colors } from "../constants/theme";

export function PremiumScreen() {
  const nav = useNavigation();
  const { t } = useTranslation();
  const { isPremium, trialActive, trialDaysLeft, setPremium, startTrial } = useUserStore();

  const features = [
    "premium.pfUnlimited",
    "premium.pfHave",
    "premium.pfFilters",
    "premium.pfRecipes",
    "premium.pfPlaner",
    "premium.pfShopping",
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
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
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

        {!trialActive && (
          <Pressable style={styles.trialButton} onPress={() => startTrial()}>
            <Text style={styles.trialButtonText}>
              {t("premium.trialStart", { count: TRIAL_DAYS })}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.button}
          onPress={() => setPremium("monthly")}
        >
          <Text style={styles.buttonText}>{t("premium.monthly", { price: PREMIUM_PRICES.monthly })}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonYearly]}
          onPress={() => setPremium("yearly")}
        >
          <Text style={styles.buttonText}>{t("premium.yearly", { price: PREMIUM_PRICES.yearly })}</Text>
          <Text style={styles.buttonBadge}>{t("premium.bestValue")}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonAlt]}
          onPress={() => setPremium("lifetime")}
        >
          <Text style={[styles.buttonText, styles.buttonTextAlt]}>{t("premium.lifetime", { price: PREMIUM_PRICES.lifetime })}</Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()}>
          <Text style={styles.back}>{t("premium.back")}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, padding: 24, justifyContent: "center" },
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
  trialButton: {
    marginTop: 20,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  trialButtonText: { color: colors.accent, fontSize: 15, fontWeight: "800" },
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
});
