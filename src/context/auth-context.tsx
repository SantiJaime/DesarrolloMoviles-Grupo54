import { createContext, use, useEffect, useState, type PropsWithChildren } from "react";
import { authenticateWithBiometrics, getBiometricSupport, type BiometricSupport } from "@/src/lib/biometrics";
import { confirmAsync } from "@/src/lib/confirm";
import {
  clearSession,
  getBiometricUserId,
  getStoredSession,
  saveSession,
  setBiometricUserId,
} from "@/src/lib/secure-session";
import { authService, type AuthResult, type RegisterInput } from "@/src/services/auth.service";
import type { Usuario } from "@/src/tipos";
import { vibrarFavorito } from "@/src/lib/haptics";

type AuthStatus = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: AuthStatus;
  usuario: Usuario | null;
  token: string | null;
  biometric: BiometricSupport;
  canUseBiometricLogin: boolean;
  rememberedUser: Usuario | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signInWithBiometrics: () => Promise<boolean>;
  signOut: () => Promise<void>;
  forgetDevice: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  toggleFavorito: (comercioId: string) => Promise<void>;
  esFavorito: (comercioId: string) => boolean;
  setRubrosDeInteres: (rubros: string[]) => Promise<void>;
  setAvisosActivos: (activos: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [biometric, setBiometric] = useState<BiometricSupport>({ available: false, label: "biometría" });
  const [biometricUserId, setBiometricUserIdState] = useState<string | null>(null);
  const [rememberedUser, setRememberedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [support, stored, bioUserId] = await Promise.all([
          getBiometricSupport(),
          getStoredSession(),
          getBiometricUserId(),
        ]);
        setBiometric(support);

        if (!stored) {
          setStatus("signedOut");
          return;
        }

        if (bioUserId === stored.usuario.id && support.available) {
          setBiometricUserIdState(bioUserId);
          setRememberedUser(stored.usuario);
          setStatus("signedOut");
          return;
        }

        await openSession(stored.token);
      } catch {
        setStatus("signedOut");
      }
    })();
  }, []);

  async function openSession(sessionToken: string) {
    let current: Usuario;
    try {
      current = await authService.me(sessionToken);
      await saveSession(sessionToken, current);
    } catch (e) {
      await clearSession();
      setBiometricUserIdState(null);
      setRememberedUser(null);
      setStatus("signedOut");
      throw e;
    }
    setToken(sessionToken);
    setUsuario(current);
    setStatus("signedIn");
  }

  async function enableBiometrics(sessionToken: string, user: Usuario): Promise<boolean> {
    const verified = await authenticateWithBiometrics("Confirmá tu identidad para activar el ingreso rápido");
    if (!verified) return false;
    await setBiometricUserId(user.id);
    setBiometricUserIdState(user.id);
    authService.updateMe(sessionToken, { biometriaHabilitada: true }).catch(() => {});
    return true;
  }

  async function completeLogin({ token: newToken, usuario: user }: AuthResult) {
    await saveSession(newToken, user);

    let bioUserId = await getBiometricUserId();
    if (bioUserId && bioUserId !== user.id) {
      await setBiometricUserId(null);
      bioUserId = null;
    }
    setBiometricUserIdState(bioUserId);

    let biometriaHabilitada = bioUserId === user.id;
    if (!biometriaHabilitada && biometric.available) {
      const wants = await confirmAsync(
        "Ingreso rápido",
        `¿Querés usar tu ${biometric.label} para ingresar la próxima vez?`,
        "Activar",
        "Ahora no"
      );
      if (wants) biometriaHabilitada = await enableBiometrics(newToken, user);
    }

    const finalUser = { ...user, biometriaHabilitada };
    await saveSession(newToken, finalUser);
    setRememberedUser(biometriaHabilitada ? finalUser : null);
    setToken(newToken);
    setUsuario(finalUser);
    setStatus("signedIn");
  }

  async function signIn(email: string, password: string) {
    await completeLogin(await authService.login(email, password));
  }

  async function signUp(input: RegisterInput) {
    await completeLogin(await authService.register(input));
  }

  async function signInWithBiometrics(): Promise<boolean> {
    const stored = await getStoredSession();
    if (!stored) {
      setBiometricUserIdState(null);
      setRememberedUser(null);
      return false;
    }
    const verified = await authenticateWithBiometrics(`Ingresar como ${stored.usuario.nombre}`);
    if (!verified) return false;
    await openSession(stored.token);
    return true;
  }

  async function signOut() {
    if (usuario && biometricUserId === usuario.id) {
      setRememberedUser(usuario);
    } else {
      if (token) authService.logout(token).catch(() => {});
      await clearSession();
    }
    setToken(null);
    setUsuario(null);
    setStatus("signedOut");
  }

  async function forgetDevice() {
    const stored = await getStoredSession();
    if (stored) authService.logout(stored.token).catch(() => {});
    await clearSession();
    setBiometricUserIdState(null);
    setRememberedUser(null);
  }

  async function setBiometricEnabled(enabled: boolean): Promise<boolean> {
    if (!usuario || !token) return false;

    let result = false;
    if (enabled) {
      result = await enableBiometrics(token, usuario);
    } else {
      await setBiometricUserId(null);
      setBiometricUserIdState(null);
      authService.updateMe(token, { biometriaHabilitada: false }).catch(() => {});
    }

    const updated = { ...usuario, biometriaHabilitada: result };
    await saveSession(token, updated);
    setUsuario(updated);
    return result;
  }

  async function toggleFavorito(comercioId: string) {
    if (!usuario || !token) return;
    const existe = usuario.favoritos.includes(comercioId);
    const nuevos = existe
      ? usuario.favoritos.filter((id) => id !== comercioId)
      : [...usuario.favoritos, comercioId];

    await vibrarFavorito();
    const updated = { ...usuario, favoritos: nuevos };
    setUsuario(updated);
    await saveSession(token, updated);
    authService.updateMe(token, { favoritos: nuevos }).catch(() => {});
  }

  function esFavorito(comercioId: string): boolean {
    return Boolean(usuario?.favoritos?.includes(comercioId));
  }

  async function setRubrosDeInteres(rubros: string[]) {
    if (!usuario || !token) return;
    const updated = { ...usuario, rubrosDeInteres: rubros };
    setUsuario(updated);
    await saveSession(token, updated);
    authService.updateMe(token, { rubrosDeInteres: rubros }).catch(() => {});
  }

  async function setAvisosActivos(activos: boolean) {
    if (!usuario || !token) return;
    const updated = { ...usuario, avisosActivos: activos };
    setUsuario(updated);
    await saveSession(token, updated);
    authService.updateMe(token, { avisosActivos: activos }).catch(() => {});
  }

  const value: AuthContextValue = {
    status,
    usuario,
    token,
    biometric,
    canUseBiometricLogin: biometric.available && biometricUserId !== null && rememberedUser !== null,
    rememberedUser,
    signIn,
    signUp,
    signInWithBiometrics,
    signOut,
    forgetDevice,
    setBiometricEnabled,
    toggleFavorito,
    esFavorito,
    setRubrosDeInteres,
    setAvisosActivos,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
