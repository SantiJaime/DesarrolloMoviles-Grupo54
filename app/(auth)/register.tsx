import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { ThemedText } from "@/src/components/themed-text";
import { Button } from "@/src/components/ui/button";
import { TextField } from "@/src/components/ui/text-field";
import { useAuth } from "@/src/context/auth-context";
import { useThemeColors } from "@/src/hooks/use-theme-color";
import { registerSchema, type RegisterForm } from "@/src/schemas/auth.schema";

export default function RegisterScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { signUp } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nombreCompleto: "", email: "", password: "", confirm: "" },
  });

  const handleRegister = handleSubmit(
    async ({ nombreCompleto, email, password }) => {
      try {
        await signUp({ nombreCompleto, email, password });
        router.replace("/");
      } catch (e) {
        setError("root", { message: (e as Error).message });
      }
    },
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={{ color: colors.muted }}>
          Creá tu cuenta para guardar favoritos, dejar reseñas y canjear
          promociones.
        </ThemedText>

        <View style={styles.form}>
          <Controller
            control={control}
            name="nombreCompleto"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <TextField
                label="Nombre completo"
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 20,
  },
  form: {
    gap: 16,
  },
});
