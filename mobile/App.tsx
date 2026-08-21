import "react-native-gesture-handler";
import "./src/i18n";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useUserStore } from "./src/store/userStore";
import { ThemeProvider } from "./src/constants/theme";

export default function App() {
  const loadUserData = useUserStore((s) => s.loadUserData);

  useEffect(() => {
    loadUserData().catch((e) => console.error("[App]", e));
  }, [loadUserData]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
