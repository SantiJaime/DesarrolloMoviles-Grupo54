import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme } from "@/src/hooks/use-theme";

export default function ScanLayout() {
  const router = useRouter();
  const { palette: colors } = useTheme();
  const atras = () => (
    <Pressable onPress={() => router.back()} hitSlop={12}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </Pressable>
  );

  return (
    <Stack screenOptions={{ headerBackTitle: "Volver", headerLeft: atras }}>
      <Stack.Screen name="index" options={{ title: "Escanear código QR" }} />
      <Stack.Screen name="historial" options={{ title: "Mi historial" }} />
    </Stack>
  );
}
