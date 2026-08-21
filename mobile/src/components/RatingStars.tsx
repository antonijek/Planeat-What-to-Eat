import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  value: number | undefined;
  onRate?: (score: number) => void;
  compact?: boolean;
}

/** Zvezdice za ocenu recepta (1–5). Ako je onRate dato, klik postavlja ocenu. */
export function RatingStars({ value, onRate, compact }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const current = value ?? 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            disabled={!onRate}
            onPress={() => onRate?.(i)}
            hitSlop={6}
          >
            <Text style={[styles.star, !compact && styles.starLg, i <= current && styles.starOn]}>
              {i <= current ? "★" : "☆"}
            </Text>
          </Pressable>
        ))}
      </View>
      {value != null && (
        <Text style={styles.label}>
          {value > 0 ? t("recipeDetail.rated", { score: value }) : t("recipeDetail.unrated")}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    stars: { flexDirection: "row", gap: 2 },
    star: { fontSize: 20, color: colors.textFaint },
    starLg: { fontSize: 26 },
    starOn: { color: colors.accent },
    label: { color: colors.textMuted, fontSize: 12 },
  });
