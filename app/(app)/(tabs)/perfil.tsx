import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { comerciosService } from "@/src/servicios/comercios";
import type { Rubro } from "@/src/tipos";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const {
    usuario,
    biometric,
    setBiometricEnabled,
    signOut,
    signIn,
    setRubrosDeInteres,
    setAvisosActivos,
  } = useAuth();

  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [updatingBiometric, setUpdatingBiometric] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    comerciosService.obtenerRubros().then((res) => setRubros(res.datos));
  }, []);

  async function toggleBiometric(enabled: boolean) {
    setUpdatingBiometric(true);
    try {
      const result = await setBiometricEnabled(enabled);
      if (enabled && !result) {
        Alert.alert("Ingreso biométrico", "No se pudo verificar tu identidad.");
      }
    } finally {
      setUpdatingBiometric(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  function toggleRubroInteres(rubroId: string) {
    if (!usuario) return;
    const actuales = usuario.rubrosDeInteres || [];
    const nuevos = actuales.includes(rubroId)
      ? actuales.filter((id) => id !== rubroId)
      : [...actuales, rubroId];
    setRubrosDeInteres(nuevos);
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {usuario ? (
          <>
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
                <ThemedText style={[styles.avatarText, { color: colors.onTint }]}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <ThemedText type="subtitle">{usuario.nombre}</ThemedText>
              <ThemedText style={{ color: colors.muted }}>
                {usuario.email} • Rol:{" "}
                <ThemedText style={{ fontWeight: "bold", color: colors.tint }}>
                  {usuario.rol.toUpperCase()}
                </ThemedText>
              </ThemedText>
            </View>

            {usuario.rol === "comercio" && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <ThemedText type="defaultSemiBold">Gestión de tu comercio</ThemedText>
                <ThemedText style={[styles.small, { color: colors.muted }]}>
                  Accedé a tus herramientas de administración y lector en mostrador.
                </ThemedText>
                <View style={styles.adminButtons}>
                  <Button
                    title="Panel de Mi Comercio"
                    icon="storefront"
                    onPress={() => router.push("/panel-comercio")}
                  />
                  <Button
                    title="Escanear cupón en mostrador"
                    variant="secondary"
                    icon="qr-code"
                    onPress={() => router.push("/scan")}
                  />
                </View>
              </View>
            )}

            {usuario.rol === "vecino" && (
              <>
                <View
                  style={[
                    styles.section,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.row}>
                    <Ionicons name="heart" size={24} color="#e91e63" />
                    <View style={styles.flex}>
                      <ThemedText type="defaultSemiBold">Favoritos</ThemedText>
                      <ThemedText style={[styles.small, { color: colors.muted }]}>
                        Tenés {usuario.favoritos.length} comercio(s) guardados.
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.section,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.row}>
                    <Ionicons name="notifications" size={24} color={colors.tint} />
                    <View style={styles.flex}>
                      <ThemedText type="defaultSemiBold">
                        Avisos de promociones
                      </ThemedText>
                      <ThemedText style={[styles.small, { color: colors.muted }]}>
                        Recibir alertas de tus favoritos y rubros elegidos.
                      </ThemedText>
                    </View>
                    <Switch
                      value={usuario.avisosActivos}
                      onValueChange={setAvisosActivos}
                      trackColor={{ true: colors.tint }}
                    />
                  </View>

                  {usuario.avisosActivos && (
                    <View style={styles.rubrosInteres}>
                      <ThemedText style={[styles.small, { fontWeight: "600" }]}>
                        Elegí tus rubros de interés:
                      </ThemedText>
                      <View style={styles.chipsWrap}>
                        {rubros.map((r) => {
                          const activo = usuario.rubrosDeInteres.includes(r.id);
                          return (
                            <Pressable
                              key={r.id}
                              onPress={() => toggleRubroInteres(r.id)}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor: activo
                                    ? colors.tint
                                    : colors.background,
                                  borderColor: colors.border,
                                },
                              ]}
                            >
                              <ThemedText
                                style={{
                                  fontSize: 12,
                                  color: activo ? colors.onTint : colors.text,
                                }}
                              >
                                {r.nombre}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            <View
              style={[
                styles.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <Ionicons name="finger-print" size={26} color={colors.tint} />
                <View style={styles.flex}>
                  <ThemedText type="defaultSemiBold">
                    Ingreso con {biometric.label}
                  </ThemedText>
                  <ThemedText style={[styles.small, { color: colors.muted }]}>
                    {biometric.available
                      ? "Accedé a la aplicación sin escribir contraseña."
                      : "Biometría no configurada en este dispositivo."}
                  </ThemedText>
                </View>
                <Switch
                  value={Boolean(usuario.biometriaHabilitada)}
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
              <ThemedText type="defaultSemiBold">Apariencia</ThemedText>
              <View style={[styles.segmented, { borderColor: colors.border }]}>
                {THEME_OPTIONS.map((opt) => {
                  const sel = opt.value === preference;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setPreference(opt.value)}
                      style={[
                        styles.segment,
                        sel && { backgroundColor: colors.tint },
                      ]}
                    >
                      <ThemedText
                        style={{
                          color: sel ? colors.onTint : colors.text,
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Button
              title="Cerrar sesión"
              variant="danger"
              icon="log-out-outline"
              loading={signingOut}
              onPress={handleSignOut}
            />
          </>
        ) : (
          <View style={styles.guestContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.card }]}>
              <Ionicons name="person-outline" size={40} color={colors.muted} />
            </View>
            <ThemedText type="title">Modo Visitante</ThemedText>
            <ThemedText style={[styles.center, { color: colors.muted }]}>
              Estás navegando la app como invitado. Podés ver todos los comercios,
              horarios y mapa sin registrarte.
            </ThemedText>

            <View style={styles.guestActions}>
              <Button
                title="Iniciar sesión"
                icon="log-in-outline"
                onPress={() => router.push("/login")}
              />
              <Button
                title="Registrarse"
                variant="secondary"
                icon="person-add-outline"
                onPress={() => router.push("/register")}
              />
            </View>
          </View>
        )}

        <View style={[styles.demoSwitch, { borderColor: colors.border }]}>
          <ThemedText style={[styles.small, { color: colors.muted, textAlign: "center" }]}>
            Accesos de prueba para defensa oral:
          </ThemedText>
          <View style={styles.demoButtons}>
            <Button
              title="Entrar como Vecino"
              variant="secondary"
              size="small"
              onPress={() => signIn("marta@mail.com", "demo1234")}
            />
            <Button
              title="Entrar como Comercio"
              variant="secondary"
              size="small"
              onPress={() => signIn("comercio@mail.com", "demo1234")}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 18,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  adminButtons: {
    gap: 10,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rubrosInteres: {
    gap: 8,
    marginTop: 8,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  segmented: {
    flexDirection: "row",
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
  },
  center: {
    textAlign: "center",
  },
  guestContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  guestActions: {
    width: "100%",
    gap: 12,
    marginTop: 12,
  },
  demoSwitch: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 10,
  },
  demoButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
});
