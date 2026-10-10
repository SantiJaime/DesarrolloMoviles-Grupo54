import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/context/auth-context";

export default function AppLayout() {
  const { status } = useAuth();

  if (status === "loading") return null;
  if (status === "signedOut") return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerBackTitle: "Volver" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="comercio/[id]" options={{ title: "Comercio" }} />
    </Stack>
  );
}
