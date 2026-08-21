import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { HomeMenu } from "./HomeMenu";
import { useTheme, ThemeColors } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigate: Nav["navigate"];
  /** Bonus stil na dugme hamburgera. */
  style?: object;
}

/**
 * Hamburger dugme + padajući HomeMenu, deljen na svim glavnim tabovima.
 * Čuva interno stanje otvorenosti da ga svaki ekran ne mora ponavljati.
 */
export function ScreenMenu({ navigate, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={[styles.btn, style]} onPress={() => setOpen(true)} hitSlop={8}>
        <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
      </Pressable>
      <HomeMenu visible={open} onClose={() => setOpen(false)} navigate={navigate} />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    btn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });
