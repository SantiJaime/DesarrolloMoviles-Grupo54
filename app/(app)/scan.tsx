import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { useTheme } from "@/src/hooks/use-theme";
import { authenticateWithBiometrics } from "@/src/lib/biometrics";
import { vibrarError, vibrarValidacionExitosa } from "@/src/lib/haptics";
import { comerciosService } from "@/src/services/comercios.service";
import type { UsoDePromocion } from "@/src/types";

export default function ScanScreen() {
  const { palette: colors } = useTheme();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [autenticadoBio, setAutenticadoBio] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const [resultado, setResultado] = useState<UsoDePromocion | null>(null);

  useEffect(() => {
    async function solicitarBiometria() {
      const ok = await authenticateWithBiometrics(
        "Confirmá tu huella o rostro para habilitar el lector en mostrador"
      );
      if (ok) {
        setAutenticadoBio(true);
      } else {
        Alert.alert(
          "Autenticación requerida",
          "Por seguridad comercial, debés validar tu identidad antes de escanear cupones.",
          [{ text: "Volver", onPress: () => router.back() }]
        );
      }
    }

    solicitarBiometria();
  }, [router]);

  if (!autenticadoBio) {
    return (
      <ThemedView style={styles.centerContainer}>
        <StateView
          type="loading"
          message="Validando identidad del comerciante..."
        />
      </ThemedView>
    );
  }

  if (!permission) {
    return <ThemedView style={styles.centerContainer} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.centerContainer}>
        <StateView
          type="error"
          title="Permiso de cámara necesario"
          message="Habilita la cámara para leer el código QR presentado por el cliente."
          actionLabel="Conceder permiso"
          onAction={requestPermission}
        />
      </ThemedView>
    );
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (escaneado) return;
    setEscaneado(true);

    try {
      const uso = await comerciosService.validarCodigoPromocion(data);
      await vibrarValidacionExitosa();
      setResultado(uso);
    } catch (e) {
      await vibrarError();
      Alert.alert("Código inválido", (e as Error).message, [
        { text: "Reintentar", onPress: () => setEscaneado(false) },
      ]);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      {resultado ? (
        <View style={styles.resultadoContainer}>
          <View style={[styles.successIcon, { backgroundColor: "#4caf50" }]}>
            <Ionicons name="checkmark-sharp" size={48} color="#fff" />
          </View>
          <ThemedText type="title">¡Cupón Validado!</ThemedText>
          <ThemedText style={{ color: colors.muted, textAlign: "center" }}>
            El beneficio fue registrado exitosamente para el cliente.
          </ThemedText>
          <View style={[styles.detailBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={{ fontWeight: "bold" }}>Código:</ThemedText>
            <ThemedText style={{ color: colors.accent }}>{resultado.codigo}</ThemedText>
            <ThemedText style={{ fontWeight: "bold", marginTop: 8 }}>Validado:</ThemedText>
            <ThemedText style={{ color: colors.muted }}>
              {new Date(resultado.validadoEn || "").toLocaleString("es-AR")}
            </ThemedText>
          </View>

          <Button
            title="Escanear otro código"
            onPress={() => {
              setResultado(null);
              setEscaneado(false);
            }}
          />
          <Button
            title="Finalizar"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <View style={styles.flex}>
          <CameraView
            style={styles.flex}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={escaneado ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </View>
              <ThemedText style={styles.hintText}>
                Alineá el código QR del cliente dentro del marco
              </ThemedText>
            </View>
          </CameraView>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  targetFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#fff",
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  hintText: {
    marginTop: 24,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  resultadoContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  detailBox: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
});
