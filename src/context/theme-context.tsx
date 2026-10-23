import React, { useState, createContext, useMemo } from "react";
import { palettes } from "@/src/constants/theme";
import { Palette } from "../types/colors";

export type ColorScheme = "dark" | "light";

type ThemeContextType = {
  theme: ColorScheme;
  setTheme: (theme: ColorScheme) => void;
  palette: Palette;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ColorScheme>("dark");

  const values = useMemo(() => {
    return {
      theme,
      setTheme,
      palette: palettes[theme],
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
  );
}
