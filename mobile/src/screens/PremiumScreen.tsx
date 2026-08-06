import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUserStore } from "../store/userStore";
import { colors } from "../constants/theme";

export function PremiumScreen() {
  const nav = useNavigation();
  const { isPremium, setPremium } = useUserStore();

  const features = [
    "Unlimited wheel spins",
    '"What do I have at home" filter',
    "All filters and diets",
    "Add and edit recipes",
    "Weekly meal planer",
    "Shopping list",
    "History and stats",
    "Dark theme",
  ];

  if (isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>💎</Text>
          <Text style={styles.doneTitle}>Premium is active!</Text>
          <Text style={styles.doneText}>Enjoy all features.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.badge}>PREMIUM</Text>
        <Text style={styles.title}>Unlock the full power of the wheel</Text>
        <Text style={styles.subtitle}>Say goodbye to "I don't know what to eat".</Text>

        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}

        <Pressable
          style={styles.button}
          onPress={() => setPremium("monthly")}
        >
          <Text style={styles.buttonText}>Monthly · 2.99€</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonAlt]}
          onPress={() => setPremium("lifetime")}
        >
          <Text style={[styles.buttonText, styles.buttonTextAlt]}>Lifetime · 49.99€</Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()}>
          <Text style={styles.back}>Back to the wheel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    color: colors.primary,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 16 },
  subtitle: { color: colors.onPrimary, fontSize: 15, marginTop: 8, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  check: { color: colors.accent, fontWeight: "900", marginRight: 10, fontSize: 16 },
  featureText: { color: "#fff", fontSize: 15 },
  button: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  buttonAlt: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#fff" },
  buttonTextAlt: { color: "#fff" },
  back: { color: colors.onPrimary, textAlign: "center", marginTop: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 12 },
  doneText: { color: colors.textMuted, marginTop: 6 },
});
