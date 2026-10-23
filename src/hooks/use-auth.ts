import { restaurarSesion, useAuthContext } from "@/src/context/auth-context";
import { authenticateWithBiometrics } from "@/src/lib/biometrics";
import { confirmAsync } from "@/src/lib/confirm";
import { vibrarFavorito } from "@/src/lib/haptics";
import { cancelarTodasLasNotificaciones } from "@/src/lib/notifications";
import {
  clearSession,
  getBiometricUserId,
  getStoredSession,
  saveSession,
  setBiometricUserId as guardarBiometricUserId,
} from "@/src/lib/secure-session";
import { authService, type AuthResult, type RegisterInput } from "@/src/services/auth.service";
import type { Usuario } from "@/src/types";

export function useAuth() {
  const {
    status,
    usuario,
    token,
    biometric,
    biometricUserId,
    rememberedUser,
    setSesion,
    setUsuario,
    setBiometricUserId,
    setRememberedUser,
  } = useAuthContext();

  async function activarBiometria(user: Usuario): Promise<boolean> {
    const ok = await authenticateWithBiometrics("Confirmá tu identidad para activar el ingreso rápido");
    if (!ok) return false;
    await guardarBiometricUserId(user.id);
    setBiometricUserId(user.id);
    return true;
  }

  async function completarIngreso({ token: nuevoToken, usuario: user }: AuthResult) {
    let bioUserId = await getBiometricUserId();
    if (bioUserId && bioUserId !== user.id) {
      await guardarBiometricUserId(null);
      bioUserId = null;
    }
    setBiometricUserId(bioUserId);

    let biometriaHabilitada = bioUserId === user.id;
    if (!biometriaHabilitada && biometric.available) {
      const quiere = await confirmAsync(
        "Ingreso rápido",
        `¿Querés usar tu ${biometric.label} para ingresar la próxima vez?`,
        "Activar",
        "Ahora no"
      );
      if (quiere) biometriaHabilitada = await activarBiometria(user);
    }

    const final = { ...user, biometriaHabilitada };
    await saveSession(nuevoToken, final);
    setRememberedUser(biometriaHabilitada ? final : null);
    setSesion({ token: nuevoToken, usuario: final });
  }

  async function guardarUsuario(actualizado: Usuario) {
    if (!token) return;
    setUsuario(actualizado);
    await saveSession(token, actualizado);
  }

  async function signIn(email: string, password: string) {
    await completarIngreso(await authService.login(email, password));
  }

  async function signUp(input: RegisterInput) {
    await completarIngreso(await authService.register(input));
  }

  async function signInWithBiometrics(): Promise<boolean> {
    const stored = await getStoredSession();
    if (!stored) {
      setBiometricUserId(null);
      setRememberedUser(null);
      return false;
    }
    const ok = await authenticateWithBiometrics(`Ingresar como ${stored.usuario.nombre}`);
    if (!ok) return false;
    try {
      setSesion(await restaurarSesion(stored.token));
    } catch (e) {
      setBiometricUserId(null);
      setRememberedUser(null);
      setSesion(null);
      throw e;
    }
    return true;
  }

  async function signOut() {
    if (usuario && biometricUserId === usuario.id) setRememberedUser(usuario);
    else await clearSession();
    setSesion(null);
  }

  async function forgetDevice() {
    await clearSession();
    setBiometricUserId(null);
    setRememberedUser(null);
  }

  async function setBiometricEnabled(enabled: boolean): Promise<boolean> {
    if (!usuario) return false;
    let activada = false;
    if (enabled) {
      activada = await activarBiometria(usuario);
    } else {
      await guardarBiometricUserId(null);
      setBiometricUserId(null);
    }
    await guardarUsuario({ ...usuario, biometriaHabilitada: activada });
    return activada;
  }

  function esFavorito(comercioId: string): boolean {
    return Boolean(usuario?.favoritos.includes(comercioId));
  }

  async function toggleFavorito(comercioId: string) {
    if (!usuario) return;
    const existe = esFavorito(comercioId);
    const favoritos = existe
      ? usuario.favoritos.filter((id) => id !== comercioId)
      : [...usuario.favoritos, comercioId];

    await vibrarFavorito();
    setUsuario({ ...usuario, favoritos });
    try {
      if (existe) await authService.quitarFavorito(comercioId);
      else await authService.agregarFavorito(comercioId);
      await guardarUsuario({ ...usuario, favoritos });
    } catch {
      setUsuario(usuario);
    }
  }

  async function setRubrosDeInteres(rubros: string[]) {
    if (!usuario) return;
    await guardarUsuario({ ...usuario, rubrosDeInteres: rubros });
    authService.updateMe({ rubrosDeInteres: rubros }).catch(() => {});
  }

  async function setAvisosActivos(activos: boolean) {
    if (!usuario) return;
    if (!activos) await cancelarTodasLasNotificaciones();
    await guardarUsuario({ ...usuario, avisosActivos: activos });
    authService.updateMe({ avisosActivos: activos }).catch(() => {});
  }

  return {
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
}
