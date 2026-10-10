import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from "react-native";

import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { useAuth } from "@/src/context/auth-context";
import { useTheme, type ThemePreference } from "@/src/context/theme-context";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const { usuario, biometric, setBiometricEnabled, signOut } = useAuth();
  const [updatingBiometric, setUpdatingBiometric] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!usuario) return null;

  async function toggleBiometric(enabled: boolean) {
    setUpdatingBiometric(true);
    try {
      const result = await setBiometricEnabled(enabled);
      if (enabled && !result)
        Alert.alert("Ingreso rápido", "No se pudo verificar tu identidad.");
    } finally {
      setUpdatingBiometric(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/login");
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <ThemedText style={[styles.avatarText, { color: colors.onTint }]}>
              {usuario.nombreCompleto.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText type="subtitle">{usuario.nombreCompleto}</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            {usuario.email}
          </ThemedText>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <MaterialIcons name="fingerprint" size={28} color={colors.tint} />
            <View style={styles.flex}>
              <ThemedText type="defaultSemiBold">
                Ingreso con {biometric.label}
              </ThemedText>
              <ThemedText style={[styles.small, { color: colors.muted }]}>
                {biometric.available
                  ? "Volvé a entrar sin escribir tu contraseña."
                  : "Tu dispositivo no tiene biometría configurada."}
              </ThemedText>
            </View>
            <Switch
              value={usuario.biometriaHabilitada}
              onValueChange={toggleBiometric}
              disabled={!biometric.available || updatingBiometric}
              trackColor={{ true: colors.tint }}
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <MaterialIcons name="contrast" size={28} color={colors.tint} />
            <ThemedText type="defaultSemiBold">Apariencia</ThemedText>
          </View>
          <View style={[styles.segmented, { borderColor: colors.border }]}>
            {THEME_OPTIONS.map((option) => {
              const selected = option.value === preference;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setPreference(option.value)}
                  style={[
                    styles.segment,
                    selected && { backgroundColor: colors.tint },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: selected ? colors.onTint : colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          title="Cerrar sesión"
          variant="danger"
          icon="logout"
          loading={signingOut}
          onPress={handleSignOut}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "bold",
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  segmented: {
    flexDirection: "row",
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
  },
});
