import React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../navigation/types";
import { colors } from "../constants/theme";

interface Props {
  emoji: string;
  title: string;
  description: string;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Zajednički ekran za premium-zaključane funkcije.
 * Prikazuje se umesto sadržaja dok korisnik nije premium.
 */
export function PremiumLockScreen({ emoji, title, description }: Props) {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Pressable style={styles.button} onPress={() => nav.navigate("Premium")}>
          <Text style={styles.buttonText}>{t("premiumLock.upgrade")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 12 },
  description: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 8 },
  button: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { color: colors.card, fontWeight: "700" },
});
