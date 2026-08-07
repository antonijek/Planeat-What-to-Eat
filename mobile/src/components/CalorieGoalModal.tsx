import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { calculateMifflinGoal, ActivityLevel, CalorieGoal } from "../services/calorieCalculator";
import { AppModal, appModalStyles } from "./AppModal";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  initialGoal: number;
  onClose: () => void;
  onSave: (kcal: number) => Promise<void>;
}

const ACTIVITIES: [ActivityLevel, string][] = [
  ["sedentary", "tracker.sedentary"],
  ["light", "tracker.light"],
  ["moderate", "tracker.moderate"],
  ["active", "tracker.active"],
  ["very_active", "tracker.veryActive"],
];

const GOALS: [CalorieGoal, string][] = [
  ["lose", "tracker.lose"],
  ["maintain", "tracker.maintain"],
  ["gain", "tracker.gain"],
];

/** Modal za podešavanje dnevnog cilja kalorija (ručno ili Mifflin-St Jeor). */
export function CalorieGoalModal({ visible, initialGoal, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [manualGoal, setManualGoal] = useState("");
  const [genPreference, setGenPreference] = useState<"male" | "female">("male");
  const [pKg, setPKg] = useState("");
  const [pCm, setPCm] = useState("");
  const [pAge, setPAge] = useState("");
  const [pActivity, setPActivity] = useState<ActivityLevel>("moderate");
  const [pGoal, setPGoal] = useState<CalorieGoal>("maintain");
  const [mifflinResult, setMifflinResult] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setManualGoal(String(initialGoal));
      setMifflinResult(null);
    }
  }, [visible, initialGoal]);

  function computeMifflin() {
    const kg = parseFloat(pKg);
    const cm = parseFloat(pCm);
    const age = parseFloat(pAge);
    if (!Number.isFinite(kg) || !Number.isFinite(cm) || !Number.isFinite(age)) return;
    if (kg <= 0 || cm <= 0 || age <= 0) return;
    setMifflinResult(calculateMifflinGoal({ gender: genPreference, kg, cm, age, activity: pActivity, goal: pGoal }));
  }

  async function save() {
    const g = parseInt(manualGoal, 10);
    if (mifflinResult !== null) {
      await onSave(mifflinResult);
      return;
    }
    if (!Number.isFinite(g) || g <= 0) return;
    await onSave(Math.round(g));
  }

  const activeBorder = { borderColor: colors.primary, backgroundColor: colors.primaryLight };

  return (
    <AppModal
      visible={visible}
      title={t("tracker.goalTitle")}
      onClose={onClose}
      onCancel={onClose}
      onSave={save}
      saveLabel={mifflinResult !== null ? t("tracker.useCalculated") : t("common.save")}
    >
      <Text style={appModalStyles.label}>{t("tracker.targetLabel")}</Text>
      <TextInput
        style={appModalStyles.input}
        value={manualGoal}
        onChangeText={setManualGoal}
        keyboardType="numeric"
        placeholder={t("tracker.targetPlaceholder")}
        placeholderTextColor={colors.textFaint}
      />

      <Text style={styles.goalSection}>{t("tracker.calcProfile")}</Text>
      <View style={styles.genderRow}>
        {(["male", "female"] as const).map((g) => (
          <Pressable
            key={g}
            style={[styles.genderBtn, genPreference === g && styles.genderBtnActive]}
            onPress={() => setGenPreference(g)}
          >
            <Text style={[styles.genderText, genPreference === g && styles.genderTextActive]}>
              {g === "male" ? t("tracker.male") : t("tracker.female")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={appModalStyles.label}>{t("tracker.weightKg")}</Text>
      <TextInput style={appModalStyles.input} value={pKg} onChangeText={setPKg} keyboardType="numeric" placeholder="e.g. 75" placeholderTextColor={colors.textFaint} />
      <Text style={appModalStyles.label}>{t("tracker.heightCm")}</Text>
      <TextInput style={appModalStyles.input} value={pCm} onChangeText={setPCm} keyboardType="numeric" placeholder="e.g. 178" placeholderTextColor={colors.textFaint} />
      <Text style={appModalStyles.label}>{t("tracker.age")}</Text>
      <TextInput style={appModalStyles.input} value={pAge} onChangeText={setPAge} keyboardType="numeric" placeholder="e.g. 30" placeholderTextColor={colors.textFaint} />

      <Text style={appModalStyles.label}>{t("tracker.activity")}</Text>
      {ACTIVITIES.map(([val, labelKey]) => (
        <Pressable
          key={val}
          style={[styles.activityRow, pActivity === val && activeBorder]}
          onPress={() => setPActivity(val)}
        >
          <Text style={[styles.activityText, pActivity === val && styles.activeText]}>{t(labelKey)}</Text>
        </Pressable>
      ))}

      <Text style={appModalStyles.label}>{t("tracker.goal")}</Text>
      {GOALS.map(([val, labelKey]) => (
        <Pressable key={val} style={[styles.activityRow, pGoal === val && activeBorder]} onPress={() => setPGoal(val)}>
          <Text style={[styles.activityText, pGoal === val && styles.activeText]}>{t(labelKey)}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.calcBtn} onPress={computeMifflin}>
        <Text style={styles.calcBtnText}>{t("tracker.calculate")}</Text>
      </Pressable>
      {mifflinResult !== null && (
        <Text style={styles.mifflinResult}>{t("tracker.recommended", { count: mifflinResult })}</Text>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  goalSection: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 4 },
  genderRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  genderText: { color: colors.text, fontWeight: "600" },
  genderTextActive: { color: colors.primary, fontWeight: "700" },
  activityRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  activityText: { color: colors.text, fontSize: 14 },
  activeText: { color: colors.primary, fontWeight: "700" },
  calcBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  calcBtnText: { color: "#fff", fontWeight: "700" },
  mifflinResult: { marginTop: 10, color: colors.success, fontSize: 14, fontWeight: "700", textAlign: "center" },
});
