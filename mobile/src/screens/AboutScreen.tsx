import React, { useMemo } from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { Screen } from "../components/Screen";
import { useTheme, ThemeColors } from "../constants/theme";

export function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Screen>
      <Text style={styles.title}>{t("about.title")}</Text>
      <Text style={styles.subtitle}>{t("about.subtitle")}</Text>

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
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 26, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 18 },
    section: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 6 },
    body: { fontSize: 14, lineHeight: 22, color: colors.text },
    link: { color: colors.primary, fontWeight: "700" },
    disclaimer: { fontSize: 12, lineHeight: 18, color: colors.textMuted, marginTop: 20, fontStyle: "italic" },
    footer: { fontSize: 12, color: colors.textMuted, marginTop: 24, textAlign: "center" },
  });
