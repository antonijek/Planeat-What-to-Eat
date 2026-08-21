import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getItem, setItem, STORAGE_KEYS } from "../storage/storage";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  onPrimary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  imageBg: string;
  placeholderBg: string;
  success: string;
  danger: string;
  dangerLight: string;
  overlay: string;
  wheel: string[];
}

export const lightColors: ThemeColors = {
  primary: "#F97316",
  primaryDark: "#EA580C",
  primaryLight: "#FFEDD5",
  onPrimary: "#FFEDD5",
  accent: "#FDE047",
  background: "#FFF7ED",
  card: "#FFFFFF",
  text: "#1C1917",
  textMuted: "#78716C",
  textFaint: "#A8A29E",
  border: "#E7E5E4",
  imageBg: "#F5F5F4",
  placeholderBg: "#E7E5E4",
  success: "#16A34A",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  overlay: "rgba(0,0,0,0.5)",
  wheel: ["#F97316", "#FB923C", "#FDE047", "#4ADE80", "#38BDF8", "#A78BFA", "#F472B6", "#FB7185"],
};

export const darkColors: ThemeColors = {
  primary: "#FB923C",
  primaryDark: "#F97316",
  primaryLight: "#3D1F12",
  onPrimary: "#1C1917",
  accent: "#FDE047",
  background: "#0F0D0C",
  card: "#1C1917",
  text: "#FAFAF9",
  textMuted: "#A8A29E",
  textFaint: "#8A8580",
  border: "#292524",
  imageBg: "#292524",
  placeholderBg: "#292524",
  success: "#4ADE80",
  danger: "#F87171",
  dangerLight: "#450A0A",
  overlay: "rgba(0,0,0,0.6)",
  wheel: ["#F97316", "#FB923C", "#FDE047", "#4ADE80", "#38BDF8", "#A78BFA", "#F472B6", "#FB7185"],
};

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  mode: "light",
  setMode: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getItem<ThemeMode>(STORAGE_KEYS.darkMode);
      if (saved === "dark" || saved === "light") setModeState(saved);
      setLoaded(true);
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    setItem(STORAGE_KEYS.darkMode, m);
  };

  const toggleMode = () => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
    setItem(STORAGE_KEYS.darkMode, mode === "light" ? "dark" : "light");
  };

  const value = useMemo(
    () => ({
      colors: mode === "dark" ? darkColors : lightColors,
      mode,
      setMode,
      toggleMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {loaded ? children : null}
    </ThemeContext.Provider>
  );
}

/** Trenutne boje teme. Koristi unutar komponente (nakon ThemeProvider). */
export function useTheme() {
  return useContext(ThemeContext);
}
