import { Alert } from "react-native";

/**
 * DIJAGNOSTIČKI privremeni handler — prikazuje pravu JS grešku kroz native Alert
 * čak i kad React nikad ne stigne da se mount-uje (production Hermes ne prikazuje redbox).
 * Ukloniti kad se pronađe i reši uzrok belog ekrana u pravom build-u.
 */
const g = global as unknown as {
  ErrorUtils?: {
    getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

const defaultHandler = g.ErrorUtils?.getGlobalHandler?.();

g.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  try {
    const text = `${error?.message ?? String(error)}\n\n${error?.stack ?? ""}`.slice(0, 1200);
    Alert.alert(isFatal ? "Fatal JS Error (debug)" : "JS Error (debug)", text);
  } catch {
    // ignoriši — samo best effort
  }
  defaultHandler?.(error, isFatal);
});
