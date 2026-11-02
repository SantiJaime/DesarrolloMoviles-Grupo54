import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { StateView } from "@/src/components/state-view";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";

export default function ScanScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.flex}>
      <StateView
        type="info"
        icon="scan-outline"
        title="Escáner de promociones"
        message="Elegí una promoción vigente y mostrá tu código QR. El comercio lo escanea para registrar el canje."
      />
      <View style={styles.actions}>
        <Button
          title="Mi historial"
          variant="secondary"
          icon="time"
          onPress={() => router.push("/scan/historial")}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  actions: {
    padding: 24,
  },
});
