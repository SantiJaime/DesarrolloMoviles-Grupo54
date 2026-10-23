import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/hooks/use-auth";

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === "signedIn") return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerBackTitle: "Volver" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Crear cuenta" }} />
    </Stack>
  );
}
