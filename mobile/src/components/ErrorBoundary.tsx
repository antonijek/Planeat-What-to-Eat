import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * DIJAGNOSTIČKI privremeni error boundary — prikazuje pravu JS grešku na ekranu
 * umesto belog ekrana, pošto production Hermes build ne prikazuje redbox.
 * Ukloniti kad se pronađe i reši uzrok belog ekrana u pravom build-u.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
          <Text style={styles.title}>App Error (debug)</Text>
          <Text style={styles.message}>{String(this.state.error.message)}</Text>
          <Text style={styles.stack}>{String(this.state.error.stack)}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 18, fontWeight: "800", color: "#DC2626", marginBottom: 12 },
  message: { fontSize: 14, color: "#1C1917", marginBottom: 12 },
  stack: { fontSize: 11, color: "#78716C" },
});
