import { useTheme } from "@/src/context/theme-context";

export function useColorScheme() {
  return useTheme().colorScheme;
}
