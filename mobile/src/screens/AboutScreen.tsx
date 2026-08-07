import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Linking, Pressable } from "react-native";
import { colors } from "../constants/theme";

/** Informacije o aplikaciji, izvorima podataka i atribuciji. */
export function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Planeat — What to Eat</Text>
        <Text style={styles.subtitle}>Spin to pick a meal, plan your week and track calories.</Text>

        <Text style={styles.section}>What's inside</Text>
        <Text style={styles.body}>
          • Wheel to decide what to eat{`\n`}
          • 789 recipes (database){`\n`}
          • "What do I have at home" filter{`\n`}
          • Weekly meal planner{`\n`}
          • Shopping list{`\n`}
          • Calorie tracker & macronutrients{`\n`}
          • Your own recipes and statistics
        </Text>

        <Text style={styles.section}>Privacy</Text>
        <Text style={styles.body}>
          Everything is stored locally on your device. No account, no cloud sync, no data leaves
          your phone. A future backend may add optional sync.
        </Text>

        <Text style={styles.section}>Data sources</Text>
        <Text style={styles.body}>
          Recipe data is sourced from{" "}
          <Text style={styles.link} onPress={() => Linking.openURL("https://www.themealdb.com")}>
            TheMealDB
          </Text>
          . Nutrition values (kcal, protein, fat, carbs, fiber, sugars, sodium, cholesterol,
          saturated fat) are estimated from the USDA (U.S. Department of Agriculture) FoodData
          Central and are approximate (±15–25%).
        </Text>

        <Text style={styles.disclaimer}>
          Nutrititional information on this app is provided for informational purposes only and is
          not a substitute for professional dietary advice.
        </Text>

        <Text style={styles.footer}>Made with ❤ · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
