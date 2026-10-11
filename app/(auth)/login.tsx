import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/src/components/themed-text";
import { Button } from "@/src/components/ui/button";
import { TextField } from "@/src/components/ui/text-field";
import { useAuth } from "@/src/context/auth-context";
import { useThemeColors } from "@/src/hooks/use-theme-color";
import { loginSchema, type LoginForm } from "@/src/schemas/auth.schema";

export default function LoginScreen() {
  const colors = useThemeColors();
  const {
    signIn,
    signInWithBiometrics,
    canUseBiometricLogin,
    rememberedUser,
    biometric,
    forgetDevice,
  } = useAuth();

  const router = useRouter();
  const [biometricLoading, setBiometricLoading] = useState(false);
  const autoPrompted = useRef(false);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleBiometricLogin = useCallback(async () => {
    clearErrors("root");
    setBiometricLoading(true);
    try {
      if (await signInWithBiometrics()) router.replace("/");
    } catch (e) {
      setError("root", { message: (e as Error).message });
    } finally {
      setBiometricLoading(false);
    }
  }, [signInWithBiometrics, router, clearErrors, setError]);

  useEffect(() => {
    if (canUseBiometricLogin && !autoPrompted.current) {
      autoPrompted.current = true;
      handleBiometricLogin();
    }
  }, [canUseBiometricLogin, handleBiometricLogin]);

  const handleLogin = handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (e) {
      setError("root", { message: (e as Error).message });
    }
  });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: colors.tint }]}>
              <Ionicons name="storefront" size={44} color={colors.onTint} />
            </View>
            <ThemedText type="title" style={styles.center}>
              Directorio Concepción
            </ThemedText>
            <ThemedText style={[styles.center, { color: colors.muted }]}>
              Centro Comercial, Industrial y de Servicios de Concepción del Uruguay
            </ThemedText>
          </View>

          {canUseBiometricLogin && rememberedUser ? (
            <View
              style={[
                styles.biometricCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ThemedText type="defaultSemiBold">
                Hola de nuevo, {rememberedUser.nombre}
              </ThemedText>
              <Button
                title={`Ingresar con ${biometric.label}`}
                icon="fingerprint"
                loading={biometricLoading}
                onPress={handleBiometricLogin}
              />
              <Pressable onPress={forgetDevice} hitSlop={8}>
                <ThemedText type="link" style={styles.center}>
                  No soy yo / usar otra cuenta
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <TextField
                  label="Email"
                  placeholder="marta@mail.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <TextField
                  label="Contraseña"
                  placeholder="••••••"
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                />
              )}
            />

            {errors.root ? (
              <ThemedText style={{ color: colors.danger }}>
                {errors.root.message}
              </ThemedText>
            ) : null}

            <Button
              title="Iniciar sesión"
              loading={isSubmitting}
              onPress={handleLogin}
            />

            <View style={styles.row}>
              <ThemedText style={{ color: colors.muted }}>
                ¿No tenés cuenta?
              </ThemedText>
              <Link href="/register" asChild>
                <Pressable hitSlop={8}>
                  <ThemedText type="link">Registrate</ThemedText>
                </Pressable>
              </Link>
            </View>

            <Pressable onPress={() => router.replace("/")} hitSlop={8}>
              <ThemedText type="link" style={styles.center}>
                Continuar explorando como invitado
              </ThemedText>
            </Pressable>
          </View>

          <View style={[styles.demoBox, { borderColor: colors.border }]}>
            <ThemedText style={[styles.hint, { color: colors.muted }]}>
              Cuentas demo de prueba:
            </ThemedText>
            <ThemedText style={[styles.hint, { color: colors.muted }]}>
              Vecino: marta@mail.com / demo1234
            </ThemedText>
            <ThemedText style={[styles.hint, { color: colors.muted }]}>
              Comercio: comercio@mail.com / demo1234
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    textAlign: "center",
  },
  biometricCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  form: {
    gap: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  demoBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 4,
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
  },
});
