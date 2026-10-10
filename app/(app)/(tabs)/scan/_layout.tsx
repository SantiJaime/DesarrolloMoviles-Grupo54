import { Stack } from 'expo-router';

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Volver' }}>
      <Stack.Screen name="index" options={{ title: 'Escanear código QR' }} />
      <Stack.Screen name="historial" options={{ title: 'Mi historial' }} />
    </Stack>
  );
}
