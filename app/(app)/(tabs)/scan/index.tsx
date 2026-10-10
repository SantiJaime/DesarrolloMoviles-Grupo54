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
        icon="qr-code-scanner"
        title="Escáner de promociones"
        message="Alineá el código QR del comercio dentro del recuadro para canjear tu beneficio."
      />
      <View style={styles.actions}>
        <Button
          title="Mi historial"
          variant="secondary"
          icon="history"
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
