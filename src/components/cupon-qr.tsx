import QRCode from "react-native-qrcode-svg";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "@/src/components/themed-text";

export function CuponQR({ codigo }: { codigo?: string }) {
  return (
    <View
      style={styles.container}
      accessibilityLabel={codigo ? `Cupón ${codigo}` : "Generando cupón"}
    >
      {codigo ? (
        <QRCode
          value={codigo}
          size={200}
          quietZone={16}
          color="#000000"
          backgroundColor="#ffffff"
          ecl="M"
        />
      ) : (
        <ActivityIndicator />
      )}
      <ThemedText selectable style={styles.codigo}>
        {codigo ?? "Generando código..."}
      </ThemedText>
      <ThemedText style={styles.ayuda}>
        El comercio escanea este QR desde su cuenta.
      </ThemedText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 12 },
  codigo: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  ayuda: { textAlign: "center", fontSize: 14 },
});
