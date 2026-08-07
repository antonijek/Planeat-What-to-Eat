import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
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
  ["sedentary", "Sedentary"],
  ["light", "Light"],
  ["moderate", "Moderate"],
  ["active", "Active"],
  ["very_active", "Very active"],
];

const GOALS: [CalorieGoal, string][] = [
  ["lose", "Lose weight (−500)"],
  ["maintain", "Maintain"],
  ["gain", "Gain weight (+500)"],
];

/** Modal za podešavanje dnevnog cilja kalorija (ručno ili Mifflin-St Jeor). */
export function CalorieGoalModal({ visible, initialGoal, onClose, onSave }: Props) {
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
      title="Daily calorie goal"
      onClose={onClose}
      onCancel={onClose}
      onSave={save}
      saveLabel={mifflinResult !== null ? "Use calculated" : "Save"}
    >
      <Text style={appModalStyles.label}>My daily target (kcal)</Text>
      <TextInput
        style={appModalStyles.input}
        value={manualGoal}
        onChangeText={setManualGoal}
        keyboardType="numeric"
        placeholder="e.g. 2000"
        placeholderTextColor={colors.textFaint}
      />

      <Text style={styles.goalSection}>Calculate from your profile</Text>
      <View style={styles.genderRow}>
        {(["male", "female"] as const).map((g) => (
          <Pressable
            key={g}
            style={[styles.genderBtn, genPreference === g && styles.genderBtnActive]}
            onPress={() => setGenPreference(g)}
          >
            <Text style={[styles.genderText, genPreference === g && styles.genderTextActive]}>
              {g === "male" ? "Male" : "Female"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={appModalStyles.label}>Weight (kg)</Text>
      <TextInput style={appModalStyles.input} value={pKg} onChangeText={setPKg} keyboardType="numeric" placeholder="e.g. 75" placeholderTextColor={colors.textFaint} />
      <Text style={appModalStyles.label}>Height (cm)</Text>
      <TextInput style={appModalStyles.input} value={pCm} onChangeText={setPCm} keyboardType="numeric" placeholder="e.g. 178" placeholderTextColor={colors.textFaint} />
      <Text style={appModalStyles.label}>Age</Text>
      <TextInput style={appModalStyles.input} value={pAge} onChangeText={setPAge} keyboardType="numeric" placeholder="e.g. 30" placeholderTextColor={colors.textFaint} />

      <Text style={appModalStyles.label}>Activity</Text>
      {ACTIVITIES.map(([val, label]) => (
        <Pressable
          key={val}
          style={[styles.activityRow, pActivity === val && activeBorder]}
          onPress={() => setPActivity(val)}
        >
          <Text style={[styles.activityText, pActivity === val && styles.activeText]}>{label}</Text>
        </Pressable>
      ))}

      <Text style={appModalStyles.label}>Goal</Text>
      {GOALS.map(([val, label]) => (
        <Pressable key={val} style={[styles.activityRow, pGoal === val && activeBorder]} onPress={() => setPGoal(val)}>
          <Text style={[styles.activityText, pGoal === val && styles.activeText]}>{label}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.calcBtn} onPress={computeMifflin}>
        <Text style={styles.calcBtnText}>Calculate</Text>
      </Pressable>
      {mifflinResult !== null && (
        <Text style={styles.mifflinResult}>Recommended: ~{mifflinResult} kcal/day</Text>
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
