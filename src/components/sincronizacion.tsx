import { useEffect } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthContext } from "@/src/context/auth-context";
import { useNetworkStatus } from "@/src/lib/network";
import {
  avisarPromosNuevas,
  registrarAvisosRemotos,
  restaurarRecordatorios,
} from "@/src/lib/notifications";
import { comerciosService } from "@/src/servicios/comercios.service";
import { resenasPendientesService } from "@/src/servicios/resenas-pendientes.service";
import { sincronizarPreferencias } from "@/src/servicios/preferencias.service";

export function Sincronizacion() {
  const { usuario, setUsuario } = useAuthContext();
  const { isOnline } = useNetworkStatus();
  const router = useRouter();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const id = response.notification.request.content.data?.comercioId;
        if (typeof id === "string")
          router.push({ pathname: "/comercio/[id]", params: { id } });
      },
    );
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!usuario || !isOnline) return;
    let activo = true;
    let trabajando = false;
    let push = false;
    async function actualizar() {
      if (
        !activo ||
        trabajando ||
        !usuario ||
        AppState.currentState !== "active"
      )
        return;
      trabajando = true;
      try {
        const actualizado = await sincronizarPreferencias();
        if (actualizado && activo) setUsuario(actualizado);
        await resenasPendientesService.sincronizar();
        if (usuario.avisosActivos && activo)
          await restaurarRecordatorios(usuario.id);
        if (usuario.avisosActivos && activo && !push) {
          const [promos, comercios] = await Promise.all([
            comerciosService.obtenerPromociones({ estado: "vigentes" }),
            comerciosService.obtenerComercios(),
          ]);
          if (activo)
            await avisarPromosNuevas(usuario, promos.datos, comercios.datos);
        }
      } catch {
      } finally {
        trabajando = false;
      }
    }
    if (usuario.avisosActivos) {
      registrarAvisosRemotos()
        .then((ok) => {
          push = ok;
        })
        .catch(() => {});
    }
    actualizar();
    const timer = setInterval(actualizar, 60_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") actualizar();
    });
    return () => {
      activo = false;
      clearInterval(timer);
      sub.remove();
    };
  }, [usuario, isOnline, setUsuario]);
  return null;
}
