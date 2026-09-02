import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, ThemeColors } from "../constants/theme";

interface Props {
  children: React.ReactNode;
  /** true = ScrollView omotač; false = samo SafeAreaView + View (za FlatList ekrane). */
  scroll?: boolean;
  /** Bonus stil na sadržaj kontejner. */
  contentStyle?: object;
  /** Boja pozadine celog ekrana (uključujući safe-area ivice). Podrazumevano colors.background. */
  backgroundColor?: string;
}

/**
 * Zajednički "screen" wrapper: SafeAreaView + (opciono) ScrollView/View sa
 * konzistentnim paddingom, bojom pozadine i razmakom na dnu.
 * Svi ekrani ga koriste da izgled bude isti.
 */
export function Screen({ children, scroll = true, contentStyle, backgroundColor }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const safe = backgroundColor ? [styles.safe, { backgroundColor }] : styles.safe;
  const content = [styles.content, contentStyle];
  if (!scroll) {
    return (
      <SafeAreaView style={safe}>
        <View style={content}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={safe}>
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
