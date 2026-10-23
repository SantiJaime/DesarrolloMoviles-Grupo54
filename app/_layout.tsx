import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { ThemeProvider } from "@/src/context/theme-context";
import { useTheme } from "@/src/hooks/use-theme";
import { getDatabase } from "@/src/lib/db";
import { configurarNotificaciones } from "@/src/lib/notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    getDatabase().catch(() => {});
    configurarNotificaciones().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { theme } = useTheme();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync();
  }, [status]);

  return (
    <NavigationThemeProvider
      value={theme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}
