import Storage from "expo-sqlite/kv-store";
import {
    createContext,
    use,
    useEffect,
    useState,
    type PropsWithChildren,
} from "react";
import {
    Appearance,
    useColorScheme as useSystemColorScheme,
} from "react-native";

import { Colors } from "@/src/constants/theme";

export type ThemePreference = "system" | "light" | "dark";
export type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  colorScheme: ColorScheme;
  colors: (typeof Colors)[ColorScheme];
  setPreference: (preference: ThemePreference) => void;
}

const PREFERENCE_KEY = "theme.preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const stored = Storage.getItemSync(PREFERENCE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const systemColorScheme = useSystemColorScheme();

  useEffect(() => {
    Appearance.setColorScheme(preference === "system" ? null : preference);
  }, [preference]);

  function setPreference(newPreference: ThemePreference) {
    setPreferenceState(newPreference);
    Storage.setItemAsync(PREFERENCE_KEY, newPreference).catch(() => {});
  }

  const colorScheme: ColorScheme =
    preference === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const value: ThemeContextValue = {
    preference,
    colorScheme,
    colors: Colors[colorScheme],
    setPreference,
  };

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
