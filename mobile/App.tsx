import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useUserStore } from "./src/store/userStore";

export default function App() {
  const loadUserData = useUserStore((s) => s.loadUserData);

  useEffect(() => {
    console.log("[App] mount, calling loadUserData");
    loadUserData()
      .then(() => console.log("[App] loadUserData OK"))
      .catch((e) => console.log("[App] loadUserData error", e));
  }, [loadUserData]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
