import * as SecureStore from "expo-secure-store";

import type { Usuario } from "@/src/types";

const TOKEN_KEY = "session.token";
const USER_KEY = "session.user";
const BIOMETRIC_USER_KEY = "session.biometric_user";

export interface StoredSession {
  token: string;
  usuario: Usuario;
}

export async function saveSession(
  token: string,
  usuario: Usuario,
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(usuario));
}

export const getStoredToken = async () => await SecureStore.getItemAsync(TOKEN_KEY);

export async function getStoredSession(): Promise<StoredSession | null> {
  const [token, rawUser] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);
  if (!token || !rawUser) return null;
  try {
    return { token, usuario: JSON.parse(rawUser) as Usuario };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY),
  ]);
}

export const getBiometricUserId = () =>
  SecureStore.getItemAsync(BIOMETRIC_USER_KEY);

export async function setBiometricUserId(userId: string | null): Promise<void> {
  if (userId) await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, userId);
  else await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
}
