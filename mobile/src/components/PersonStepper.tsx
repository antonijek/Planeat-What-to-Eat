import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function PersonStepper({ value, onChange, min = 1, max = 30 }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.btn}
        hitSlop={8}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.label}>{t("recipeDetail.personsLabel")}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.btn}
        hitSlop={8}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      paddingVertical: 12,
    },
    btn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    btnText: {
      fontSize: 26,
      color: colors.primary,
      lineHeight: 30,
    },
    center: { alignItems: "center" },
    label: { fontSize: 11, color: colors.textMuted, letterSpacing: 1 },
    value: { fontSize: 28, fontWeight: "700", color: colors.text },
  });
