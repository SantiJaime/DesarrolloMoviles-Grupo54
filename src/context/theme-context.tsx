import { palettes } from "@/src/constants/theme";
import { getKV, setKV } from "@/src/lib/db";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
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
  const [theme, setThemeState] = useState<ColorScheme>("dark");

  useEffect(() => {
    getKV("tema").then((guardado) => {
      if (guardado === "dark" || guardado === "light") setThemeState(guardado);
    });
  }, []);

  const setTheme = useCallback((nuevo: ColorScheme) => {
    setThemeState(nuevo);
    setKV("tema", nuevo);
  }, []);

  const values = useMemo(() => {
    return {
      theme,
      setTheme,
      palette: palettes[theme],
    };
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
  );
}
