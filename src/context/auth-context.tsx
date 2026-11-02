import {
  getBiometricSupport,
  type BiometricSupport,
} from "@/src/lib/biometrics";
import {
  clearSession,
  getBiometricUserId,
  getStoredSession,
  saveSession,
} from "@/src/lib/secure-session";
import { authService } from "@/src/servicios/auth.service";
import type { Usuario } from "@/src/tipos";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { isAxiosError } from "axios";
import { checkNetworkStatus } from "@/src/lib/network";
import { aplicarPreferenciasPendientes } from "@/src/servicios/preferencias.service";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface Sesion {
  token: string;
  usuario: Usuario;
}

interface AuthContextValue {
  status: AuthStatus;
  usuario: Usuario | null;
  token: string | null;
  biometric: BiometricSupport;
  biometricUserId: string | null;
  rememberedUser: Usuario | null;
  setSesion: (sesion: Sesion | null) => void;
  setUsuario: (usuario: Usuario) => void;
  setBiometricUserId: (userId: string | null) => void;
  setRememberedUser: (usuario: Usuario | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export async function restaurarSesion(token: string): Promise<Sesion> {
  const stored = await getStoredSession();
  if (!(await checkNetworkStatus()) && stored?.token === token) return stored;
  try {
    const [remoto, bioUserId] = await Promise.all([
      authService.me(token),
      getBiometricUserId(),
    ]);
    const usuario = await aplicarPreferenciasPendientes({
      ...remoto,
      biometriaHabilitada: bioUserId === remoto.id,
    });
    await saveSession(token, usuario);
    return { token, usuario };
  } catch (e) {
    if (isAxiosError(e) && [401, 403].includes(e.response?.status ?? 0)) {
      await clearSession();
    } else if (stored?.token === token) {
      return stored;
    }
    throw e;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [sesion, setSesionState] = useState<Sesion | null>(null);
  const [biometric, setBiometric] = useState<BiometricSupport>({
    available: false,
    label: "biometría",
  });
  const [biometricUserId, setBiometricUserId] = useState<string | null>(null);
  const [rememberedUser, setRememberedUser] = useState<Usuario | null>(null);
  const setUsuario = useCallback(
    (usuario: Usuario) =>
      setSesionState((actual) => (actual ? { ...actual, usuario } : actual)),
    [],
  );

  function setSesion(nueva: Sesion | null) {
    setSesionState(nueva);
    setStatus(nueva ? "signedIn" : "signedOut");
  }

  useEffect(() => {
    (async () => {
      try {
        const [support, stored, bioUserId] = await Promise.all([
          getBiometricSupport(),
          getStoredSession(),
          getBiometricUserId(),
        ]);
        setBiometric(support);
        if (!stored) return setSesion(null);

        if (support.available && bioUserId === stored.usuario.id) {
          setBiometricUserId(bioUserId);
          setRememberedUser(stored.usuario);
          return setSesion(null);
        }
        setSesion(await restaurarSesion(stored.token));
      } catch {
        setSesion(null);
      }
    })();
  }, []);

  const value: AuthContextValue = {
    status,
    usuario: sesion?.usuario ?? null,
    token: sesion?.token ?? null,
    biometric,
    biometricUserId,
    rememberedUser,
    setSesion,
    setUsuario,
    setBiometricUserId,
    setRememberedUser,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
