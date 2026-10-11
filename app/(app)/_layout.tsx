import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Volver" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="comercio/[id]" options={{ title: "Comercio" }} />
      <Stack.Screen
        name="scan"
        options={{
          title: "Validar Cupón",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="panel-comercio"
        options={{
          title: "Mi Comercio",
        }}
      />
    </Stack>
  );
}
