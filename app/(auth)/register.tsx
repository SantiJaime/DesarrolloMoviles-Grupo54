import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
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
import { useAuth } from "@/src/hooks/use-auth";
import { useTheme } from "@/src/hooks/use-theme";
import { registerSchema, type RegisterForm } from "@/src/schemas/auth.schema";

export default function RegisterScreen() {
  const { palette: colors } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const handleRegister = handleSubmit(async ({ nombre, email, password }) => {
    try {
      await signUp({ nombre, email, password });
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
          <ThemedText type="title">Creá tu cuenta</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            Accedé a promociones exclusivas, guardá tus comercios favoritos y
            opiná.
          </ThemedText>

          <ThemedText>
            El registro crea una cuenta de vecino. El Centro Comercial habilita
            las cuentas de los comercios asociados.
          </ThemedText>

          <View style={styles.form}>
            <Controller
              control={control}
              name="nombre"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <TextField
                  label="Nombre y apellido"
                  autoComplete="name"
                  textContentType="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <TextField
                  label="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
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
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="confirm"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <TextField
                  label="Repetir contraseña"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
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
              title="Crear cuenta"
              loading={isSubmitting}
              onPress={handleRegister}
            />

            <View style={styles.row}>
              <ThemedText style={{ color: colors.muted }}>
                ¿Ya tenés cuenta?
              </ThemedText>
              <Link href="/login" asChild>
                <Pressable hitSlop={8}>
                  <ThemedText type="link">Iniciá sesión</ThemedText>
                </Pressable>
              </Link>
            </View>
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
    padding: 24,
    gap: 16,
  },
  rolSelector: {
    gap: 8,
    marginTop: 4,
  },
  rolButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rolBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
  form: {
    gap: 14,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
});
