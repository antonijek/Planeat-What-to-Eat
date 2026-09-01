import { Platform } from "react-native";
import Constants from "expo-constants";

/** App Store / Play Store link, read from app.json (ios.appStoreUrl / android.playStoreUrl). */
export function getStoreUrl(): string | null {
  const config = Constants.expoConfig;
  if (Platform.OS === "ios") return config?.ios?.appStoreUrl ?? null;
  if (Platform.OS === "android") return config?.android?.playStoreUrl ?? null;
  return null;
}
