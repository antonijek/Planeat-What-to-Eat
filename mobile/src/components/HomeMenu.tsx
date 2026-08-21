import React, { useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme, ThemeColors, lightColors } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { LANGUAGES } from "../i18n";
import i18n from "../i18n";
import { settingsService } from "../services/settingsService";
import { useUserStore } from "../store/userStore";
import { isFeatureUnlocked } from "../services/premiumService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MenuRoute =
  | "CalorieLog"
  | "MyRecipes"
  | "Planer"
  | "History"
  | "Stats"
  | "About";

interface MenuItem {
  key: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  route: MenuRoute;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  navigate: Nav["navigate"];
}

export function HomeMenu({ visible, onClose, navigate }: Props) {
  const { t } = useTranslation();
  const current = i18n.language.slice(0, 2);
  const { isPremium, trialActive, trialDaysLeft } = useUserStore();
  const { mode, toggleMode } = useTheme();
  const colors = lightColors;
  const styles = useMemo(() => createStyles(colors), []);
  const themeUnlocked = isFeatureUnlocked("darkTheme", isPremium, trialActive);

  const items: MenuItem[] = useMemo(
    () => [
      { key: "tracker", icon: "food-apple-outline", label: t("home.shortcutTracker"), route: "CalorieLog" },
      { key: "recipes", icon: "chef-hat", label: t("home.shortcutRecipes"), route: "MyRecipes" },
      { key: "planer", icon: "calendar-month", label: t("home.shortcutPlaner"), route: "Planer" },
      { key: "cooked", icon: "history", label: t("home.shortcutCooked"), route: "History" },
      { key: "stats", icon: "chart-bar", label: t("home.shortcutStats"), route: "Stats" },
      { key: "about", icon: "information-outline", label: t("home.shortcutAbout"), route: "About" },
    ],
    [t]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>{t("home.menuTitle")}</Text>

            {!isPremium && trialActive && (
              <View style={styles.trialBanner}>
                <Text style={styles.trialBannerText}>
                  {t("home.trialLeft", { count: trialDaysLeft })}
                </Text>
              </View>
            )}

            <View style={styles.grid}>
              {items.map((item) => (
                <Pressable
                  key={item.key}
                  style={styles.gridItem}
                  onPress={() => {
                    onClose();
                    navigate(item.route);
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={26} color={colors.primary} />
                  <Text style={styles.gridItemLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {themeUnlocked && (
              <>
                <Text style={styles.sectionTitle}>{t("home.theme")}</Text>
                <View style={styles.langRow}>
                  <Pressable
                    style={[styles.langChip, mode === "light" && styles.langChipActive]}
                    onPress={() => {
                      if (mode !== "light") toggleMode();
                    }}
                  >
                    <Text style={[styles.langText, mode === "light" && styles.langTextActive]}>
                      ☀️ {t("home.themeLight")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.langChip, mode === "dark" && styles.langChipActive]}
                    onPress={() => {
                      if (mode !== "dark") toggleMode();
                    }}
                  >
                    <Text style={[styles.langText, mode === "dark" && styles.langTextActive]}>
                      🌙 {t("home.themeDark")}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            <Text style={styles.sectionTitle}>{t("about.language")}</Text>
            <View style={styles.langRow}>
              {LANGUAGES.map((l) => {
                const active = current === l.code;
                return (
                  <Pressable
                    key={l.code}
                    style={[styles.langChip, active && styles.langChipActive]}
                    onPress={() => {
                      i18n.changeLanguage(l.code);
                      settingsService.saveLanguage(l.code);
                      onClose();
                    }}
                  >
                    <Text style={[styles.langText, active && styles.langTextActive]}>{l.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    backdropTouch: { ...StyleSheet.absoluteFillObject },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      maxHeight: "80%",
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 12,
    },
    sheetContent: { paddingBottom: 8 },
    title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 16 },
    trialBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    trialBannerText: { color: colors.primary, fontSize: 13, fontWeight: "700", textAlign: "center" },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    gridItem: {
      width: "30.5%",
      flexGrow: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    gridItemLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 6,
      textAlign: "center",
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
    },
    langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    langChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    langChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    langText: { fontSize: 13, fontWeight: "600", color: colors.text },
    langTextActive: { color: "#fff" },
  });
