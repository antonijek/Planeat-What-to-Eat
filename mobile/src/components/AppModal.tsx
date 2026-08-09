import React, { ReactNode } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { colors } from "../constants/theme";

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  onDelete?: () => void;
  children: ReactNode;
}

/**
 * Zajednički modal šablon za celu aplikaciju.
 * Uvek isti izgled: pozadina, zaglavlje, sadržaj i red dugmadi.
 */
export function AppModal({
  visible,
  title,
  onClose,
  onSave,
  saveLabel = "Save",
  onCancel,
  cancelLabel = "Cancel",
  onDelete,
  children,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior="padding"
      >
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
          >{children}</ScrollView>
          {(onSave || onDelete) && (
            <View style={styles.btnRow}>
              {onDelete && (
                <Pressable style={styles.deleteBtn} onPress={onDelete}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </Pressable>
              )}
              <Pressable style={styles.cancelBtn} onPress={onCancel ?? onClose}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
              {onSave && (
                <Pressable style={styles.saveBtn} onPress={onSave}>
                  <Text style={styles.saveText}>{saveLabel}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const appModalStyles = StyleSheet.create({
  label: { fontSize: 13, color: colors.textMuted, fontWeight: "600", marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignSelf: "flex-end",
    width: "100%",
    maxHeight: "98%",
    flexShrink: 1,
  },
  scroll: { flexGrow: 1, flexShrink: 1 },
  scrollContent: { paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 16, flexShrink: 0 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 4, flexShrink: 0 },
  deleteBtn: {
    width: 48,
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { fontSize: 18 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: colors.text, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
