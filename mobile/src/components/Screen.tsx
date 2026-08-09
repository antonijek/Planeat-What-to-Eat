import React from "react";
import { View, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { colors } from "../constants/theme";

interface Props {
  children: React.ReactNode;
  /** true = ScrollView omotač; false = samo SafeAreaView + View (za FlatList ekrane). */
  scroll?: boolean;
  /** Bonus stil na sadržaj kontejner. */
  contentStyle?: object;
}

/**
 * Zajednički "screen" wrapper: SafeAreaView + (opciono) ScrollView/View sa
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
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 40,
  },
});
