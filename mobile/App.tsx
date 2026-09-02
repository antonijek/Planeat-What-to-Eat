import "react-native-gesture-handler";
import "./src/i18n";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { setAudioModeAsync } from "expo-audio";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useUserStore } from "./src/store/userStore";
import { ThemeProvider } from "./src/constants/theme";
import { ErrorBoundary } from "./src/components/ErrorBoundary";

export default function App() {
  const loadUserData = useUserStore((s) => s.loadUserData);

  useEffect(() => {
    loadUserData().catch((e) => console.error("[App]", e));
  }, [loadUserData]);

  useEffect(() => {
    // Zvuk točka mora da se čuje i kad je iPhone na "silent" prekidaču.
    setAudioModeAsync({ playsInSilentMode: true }).catch((e) => console.error("[App audio]", e));
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
