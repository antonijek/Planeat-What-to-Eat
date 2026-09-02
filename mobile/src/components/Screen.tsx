import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  children: React.ReactNode;
  /** true = ScrollView omotač; false = samo SafeAreaView + View (za FlatList ekrane). */
  scroll?: boolean;
  /** Bonus stil na sadržaj kontejner. */
  contentStyle?: object;
  /** Boja pozadine celog ekrana (uključujući safe-area ivice). Podrazumevano colors.background. */
  backgroundColor?: string;
  /**
   * Koje ivice dobijaju safe-area padding. Podrazumevano sve četiri — za ekrane
   * BEZ native header-a (tabovi). Ekrani SA native header-om (strelica nazad)
   * već imaju pokriven vrh headerom, pa treba `["bottom", "left", "right"]"
   * da se izbegne duplo računanje statusne trake ispod strelice.
   */
  edges?: readonly Edge[];
}

/**
 * Zajednički "screen" wrapper: SafeAreaView + (opciono) ScrollView/View sa
 * konzistentnim paddingom, bojom pozadine i razmakom na dnu.
 * Svi ekrani ga koriste da izgled bude isti.
 */
export function Screen({ children, scroll = true, contentStyle, backgroundColor, edges }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const safe = backgroundColor ? [styles.safe, { backgroundColor }] : styles.safe;
  const content = [styles.content, contentStyle];
  if (!scroll) {
    return (
      <SafeAreaView style={safe} edges={edges}>
        <View style={content}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={safe} edges={edges}>
      <ScrollView
        contentContainerStyle={content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 40,
    },
  });
