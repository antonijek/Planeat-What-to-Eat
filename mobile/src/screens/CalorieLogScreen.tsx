import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import {
  calorieLogService,
  DailyTotals,
  dateKeyOffset,
  dateKeyForToday,
} from "../services/calorieLogService";
import { suggestIngredients } from "../services/calorieCalculator";
import { useUserStore } from "../store/userStore";
import { PremiumLockScreen } from "../components/PremiumLockScreen";
import { CalorieGoalModal } from "../components/CalorieGoalModal";
import { colors } from "../constants/theme";

function dayTitle(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString();
}

/** Prikaz makroa za stavku — samo vrednosti >0, da se ne vide "0g · Protein 0g · …". */
function rowMetaText(item: { grams: number; protein: number; fat: number; carbs: number }): string {
  const parts: string[] = [];
  if (item.grams > 0) parts.push(`${item.grams}g`);
  if (item.protein > 0) parts.push(`Protein ${item.protein}g`);
  if (item.fat > 0) parts.push(`Fat ${item.fat}g`);
  if (item.carbs > 0) parts.push(`Carbs ${item.carbs}g`);
  return parts.join(" · ");
}

export function CalorieLogScreen() {
  const [offset, setOffset] = useState(0);
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [totals, setTotals] = useState<DailyTotals>({
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    entries: [],
    count: 0,
  });
  const [suggestions, setSuggestions] = useState<
    { key: string; label: string; per100: { kcal: number; protein: number; fat: number; carbs: number }; grams: number }[]
  >([]);
  const [selectedSug, setSelectedSug] = useState<
    { label: string; per100: { kcal: number; protein: number; fat: number; carbs: number } } | null
  >(null);
  const [manualKcal, setManualKcal] = useState("");
  const gramsRef = useRef<TextInput>(null);
  const [goalModal, setGoalModal] = useState(false);
  const { isPremium, calorieGoal, setCalorieGoal } = useUserStore();

  const dateKey = dateKeyOffset(offset);
  const todayKey = dateKeyForToday();

  const load = useCallback(async (off: number) => {
    setTotals(await calorieLogService.getTotalsForDay(dateKeyOffset(off)));
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  if (!isPremium) {
    return (
      <PremiumLockScreen
        emoji="🥗"
        title="Calorie log"
        description="Premium feature. Track your daily calories and macros."
      />
    );
  }

  function changeOffset(delta: number) {
    const next = offset + delta;
    setOffset(next);
    load(next);
  }

  function openGoalModal() {
    setGoalModal(true);
  }

  async function saveGoal(kcal: number) {
    await setCalorieGoal(kcal);
    setGoalModal(false);
  }

  function onNameChange(text: string) {
    setName(text);
    setSelectedSug(null);
    setManualKcal("");
    const sug = suggestIngredients(text);
    setSuggestions(sug.slice(0, 4));
  }

  const lookup = calorieLogService.lookup(name);

  async function add() {
    const g = parseFloat(grams);
    const manual = parseFloat(manualKcal);
    // Ručni unos kalorija (jelo/sastojak nije u bazi)
    if (manualKcal.trim() && Number.isFinite(manual) && manual > 0) {
      setTotals(await calorieLogService.addManualEntry(name, manual, dateKey));
      setName("");
      setGrams("");
      setManualKcal("");
      setSuggestions([]);
      setSelectedSug(null);
      return;
    }
    if (!name.trim() || !Number.isFinite(g) || g <= 0) return;
    try {
      // ako je korisnik odabrao konkretnu sugestiju (kuvano/sirovo), koristi NJENE vrednosti
      if (selectedSug) {
        setTotals(await calorieLogService.addEntry(selectedSug.label, g, dateKey, selectedSug.per100));
      } else {
        setTotals(await calorieLogService.addEntry(name, g, dateKey));
      }
      setName("");
      setGrams("");
      setSuggestions([]);
      setSelectedSug(null);
      setManualKcal("");
    } catch {
      // sastojak nije nađen u mapi — tiho
    }
  }

  /** Klik na sugestiju samo OZNAČI izabranu varijantu — gramažu upiše korisnik pa klikne +. */
  function selectSuggestion(sug: {
    label: string;
    per100: { kcal: number; protein: number; fat: number; carbs: number };
    grams: number;
  }) {
    setName(sug.label);
    setSelectedSug(sug);
    setSuggestions([]);
    gramsRef.current?.focus();
  }

  async function remove(id: string) {
    setTotals(await calorieLogService.removeEntry(id, dateKey));
  }

  const kcalLeft = calorieGoal - totals.kcal;
  const overBudget = kcalLeft < 0;
  const isToday = dateKey === todayKey;
  const showSuggestions = suggestions.length > 0 && !!name.trim();
  const hasCookedRawSuggestion = suggestions.some((s) => s.key.includes(":cooked") || s.key.includes(":raw"));
  const manualMode = !!name.trim() && !selectedSug && !lookup.found && suggestions.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={totals.entries}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Calorie tracker</Text>

            <View style={styles.dayNav}>
              <Pressable style={styles.navBtn} onPress={() => changeOffset(-1)}>
                <Text style={styles.navText}>◀</Text>
              </Pressable>
              <Text style={styles.dayLabel}>{dayTitle(offset)}</Text>
              <Pressable
                style={styles.navBtn}
                onPress={() => (offset < 0 ? changeOffset(1) : null)}
                disabled={offset >= 0}
              >
                <Text style={[styles.navText, offset >= 0 && styles.navTextDisabled]}>▶</Text>
              </Pressable>
            </View>

            <View style={styles.dayCard}>
              <View style={styles.dayTop}>
                <Text style={styles.dayTotal}>{totals.kcal.toLocaleString()} kcal</Text>
                {isToday && (
                  overBudget ? (
                    <Text style={styles.dayOver}>🔥 {Math.abs(kcalLeft).toLocaleString()} over {calorieGoal}</Text>
                  ) : (
                    <Text style={styles.dayLeft}>~{kcalLeft} left of {calorieGoal}</Text>
                  )
                )}
              </View>
              <Pressable style={styles.goalBtn} onPress={openGoalModal}>
                <Text style={styles.goalBtnText}>⚙ Set daily goal ({calorieGoal} kcal)</Text>
              </Pressable>
              <View style={styles.macRow}>
                <Text style={styles.mac}>{totals.protein}g protein</Text>
                <Text style={styles.mac}>{totals.fat}g fat</Text>
                <Text style={styles.mac}>{totals.carbs}g carbs</Text>
              </View>
              {isToday && overBudget && (
                <Text style={styles.overBanner}>
                  🔥 You've exceeded your daily goal of {calorieGoal} kcal.
                </Text>
              )}
            </View>

            {isToday && (
              <>
                <Text style={styles.label}>What did you eat?</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    placeholder="Food (e.g. chicken)"
                    value={name}
                    onChangeText={onNameChange}
                    placeholderTextColor={colors.textFaint}
                  />
                  <TextInput
                    ref={gramsRef}
                    style={[styles.input, styles.gramsInput]}
                    placeholder="Gram"
                    value={grams}
                    onChangeText={setGrams}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textFaint}
                  />
                  <Pressable style={styles.addBtn} onPress={add}>
                    <Text style={styles.addText}>+</Text>
                  </Pressable>
                </View>
                {name.trim().length > 0 &&
                  (selectedSug ? (
                    <Text style={styles.hint}>~{selectedSug.per100.kcal} kcal per 100g</Text>
                  ) : lookup.found ? (
                    <Text style={styles.hint}>~{lookup.per100Kcal} kcal per 100g</Text>
                  ) : manualMode ? (
                    <Text style={styles.hintWarn}>Not found in database.</Text>
                  ) : null)}

                {hasCookedRawSuggestion && !!name.trim() && !selectedSug && (
                  <Text style={styles.hint}>Tap a suggestion to choose cooked/raw, then add grams +.</Text>
                )}
                {selectedSug && (
                  <Text style={[styles.hint, { color: colors.primary }]}>
                    Selected: {selectedSug.label} — enter grams and tap +.
                  </Text>
                )}
                {suggestions.length > 0 && !!name.trim() && (
                  <View style={styles.suggestBox}>
                    {suggestions.map((s) => (
                      <Pressable key={s.key} style={styles.suggestRow} onPress={() => selectSuggestion(s)}>
                        <Text style={styles.suggestText}>{s.label}</Text>
                        <Text style={styles.suggestKcal}>~{s.per100.kcal} kcal</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {manualMode && (
                  <View style={styles.notFoundBox}>
                    <Text style={styles.notFoundTitle}>
                      Not in our ingredient/common-dish database.
                    </Text>
                    <Text style={styles.notFoundText}>
                      The database covers ingredients and common dishes. If it's not here, enter calories manually below.
                    </Text>
                    <View style={styles.manualRow}>
                      <TextInput
                        style={[styles.input, styles.manualInput]}
                        placeholder="kcal (e.g. 350)"
                        value={manualKcal}
                        onChangeText={setManualKcal}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textFaint}
                      />
                      <Pressable style={styles.addBtn} onPress={add}>
                        <Text style={styles.addText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}

            <Text style={styles.section}>
              {dayTitle(offset)} {totals.count ? `(${totals.count})` : ""}
            </Text>
          </View>
        }
        contentContainerStyle={styles.content}
        contentInset={{ bottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No entries for this day.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta}>{rowMetaText(item)}</Text>
            </View>
            <Text style={styles.rowKcal}>{item.kcal} kcal</Text>
            <Pressable onPress={() => remove(item.id)} hitSlop={8}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        )}
      />

      <CalorieGoalModal
        visible={goalModal}
        initialGoal={calorieGoal}
        onClose={() => setGoalModal(false)}
        onSave={saveGoal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  navText: { fontSize: 20, color: colors.primary, fontWeight: "700" },
  navTextDisabled: { color: colors.textFaint },
  dayLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  dayCard: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  dayTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  dayTotal: { fontSize: 30, fontWeight: "800", color: colors.primary },
  dayLeft: { fontSize: 13, color: colors.textMuted },
  dayOver: { fontSize: 13, color: colors.danger, fontWeight: "700" },
  overBanner: {
    marginTop: 12,
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 10,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  goalBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalBtnText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  macRow: { flexDirection: "row", gap: 14, marginTop: 12 },
  mac: { color: colors.text, fontSize: 14, fontWeight: "600" },
  label: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 20 },
  inputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameInput: { flex: 2 },
  gramsInput: { flex: 1 },
  addBtn: {
    width: 44,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#fff", fontSize: 24, lineHeight: 28 },
  hint: { color: colors.success, fontSize: 12, marginTop: 6 },
  hintWarn: { color: colors.danger, fontSize: 12, marginTop: 6 },
  suggestBox: {
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 6,
  },
  suggestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginVertical: 1,
  },
  suggestText: { color: colors.success, fontSize: 15, fontWeight: "600" },
  suggestKcal: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  notFoundBox: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 12,
  },
  notFoundTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  notFoundText: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  manualRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  manualInput: { flex: 1 },
  section: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 24, marginBottom: 8 },
  empty: { color: colors.textMuted, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  rowBody: { flex: 1 },
  rowName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  rowMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowKcal: { color: colors.primary, fontWeight: "700", marginRight: 14 },
  remove: { color: colors.danger, fontSize: 18 },
});
