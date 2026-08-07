import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Linking, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { colors } from "../constants/theme";

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export function AboutScreen() {
  const { t, i18n: i18nHook } = useTranslation();
  const current = i18nHook.language.slice(0, 2);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("about.title")}</Text>
        <Text style={styles.subtitle}>{t("about.subtitle")}</Text>

        <Text style={styles.section}>🌐 {t("about.language")}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((l) => {
            const active = current === l.code;
            return (
              <Pressable
                key={l.code}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => i18n.changeLanguage(l.code)}
              >
                <Text style={[styles.langText, active && styles.langTextActive]}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>{t("about.what")}</Text>
        <Text style={styles.body}>{t("about.features")}</Text>

        <Text style={styles.section}>{t("about.privacy")}</Text>
        <Text style={styles.body}>{t("about.privacyText")}</Text>

        <Text style={styles.section}>{t("about.dataSources")}</Text>
        <Text style={styles.body}>
          <Text>{t("about.dataFrom")}</Text>{" "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://www.themealdb.com")}>
            TheMealDB
          </Text>
          <Text>{t("about.dataSuffix")}</Text>
        </Text>

        <Text style={styles.disclaimer}>{t("about.disclaimer")}</Text>

        <Text style={styles.footer}>{t("about.footer")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 18 },
  section: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 22, color: colors.text },
  link: { color: colors.primary, fontWeight: "700" },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  langChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontSize: 13, fontWeight: "600", color: colors.text },
  langTextActive: { color: "#fff" },
  disclaimer: { fontSize: 12, lineHeight: 18, color: colors.textMuted, marginTop: 20, fontStyle: "italic" },
  footer: { fontSize: 12, color: colors.textMuted, marginTop: 24, textAlign: "center" },
});
