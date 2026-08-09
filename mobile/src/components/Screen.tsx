import React from "react";
import { View, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { colors } from "../constants/theme";

interface Props {
  children: React.ReactNode;
  /** Da li je unutrašnjost skrolabilna (default true). */
  scroll?: boolean;
  /** Bonus stil na content kontejner. */
  contentStyle?: object;
}

/**
 * Zajednički "screen" wrapper: SafeAreaView + (opciono) ScrollView sa
 * konzistentnim paddingom, bojom pozadine i razmakom na dnu.
 * Svi ekrani ga koriste da izgled bude isti.
 */
export function Screen({ children, scroll = true, contentStyle }: Props) {
  const content = [styles.content, contentStyle];
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={content}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
});
