import React, { useMemo } from "react";
import { Text, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  label: string;
  style?: StyleProp<ViewStyle>;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PremiumBanner({ label, style }: Props) {
  const nav = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable style={[styles.banner, style]} onPress={() => nav.navigate("Premium")}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    banner: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    text: { color: "#fff", fontWeight: "700", textAlign: "center" },
  });
