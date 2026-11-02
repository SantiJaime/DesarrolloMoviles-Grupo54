import { getKV, setKV } from "@/src/lib/db";
import { getStoredSession } from "@/src/lib/secure-session";
import { esPromocionVigente } from "@/src/lib/promociones";
import { api } from "@/src/servicios/api/client";
import type { ApiRespuesta, Comercio, Promocion, Usuario } from "@/src/tipos";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { isAxiosError } from "axios";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function configurarNotificaciones(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("default", {
      name: "Promociones",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#9184d9",
    });
  const actual = await Notifications.getPermissionsAsync();
  return (
    actual.granted || (await Notifications.requestPermissionsAsync()).granted
  );
}

export function seleccionarPromosParaAvisar(
  usuario: Usuario,
  promos: Promocion[],
  comercios: Comercio[],
  avisadas: string[],
) {
  return promos.filter(
    (p) =>
      esPromocionVigente(p) &&
      !avisadas.includes(p.id) &&
      (usuario.favoritos.includes(p.comercioId) ||
        usuario.rubrosDeInteres.includes(
          comercios.find((c) => c.id === p.comercioId)?.rubroId ?? "",
        )),
  );
}

export async function avisarPromosNuevas(
  usuario: Usuario,
  promos: Promocion[],
  comercios: Comercio[],
) {
  if (
    !usuario.avisosActivos ||
    !(await Notifications.getPermissionsAsync()).granted
  )
    return;
  const clave = `promos_avisadas:${usuario.id}`;
  const guardado = await getKV(clave);
  const avisadas: string[] = guardado ? JSON.parse(guardado) : [];
  const vigentes = promos.filter((p) => esPromocionVigente(p));
  if (guardado === null) {
    await setKV(clave, JSON.stringify(vigentes.map((p) => p.id)));
    return;
  }
  const nuevas = seleccionarPromosParaAvisar(
    usuario,
    vigentes,
    comercios,
    avisadas,
  );
  for (const promo of nuevas) {
    const actual = await getStoredSession();
    if (actual?.usuario.id !== usuario.id || !actual.usuario.avisosActivos)
      return;
    await Notifications.scheduleNotificationAsync({
      identifier: `nueva:${usuario.id}:${promo.id}`,
      content: {
        title: `Nueva promoción en ${comercios.find((c) => c.id === promo.comercioId)?.nombre ?? "un comercio"}`,
        body: `${promo.titulo}: ${promo.detalle}`,
        data: { comercioId: promo.comercioId },
      },
      trigger: null,
    });
    avisadas.push(promo.id);
    await setKV(clave, JSON.stringify(avisadas));
  }
}

type Guardada = { promo: Promocion; comercioNombre: string };
export async function programarRecordatorioPromoPorVencer(
  promo: Promocion,
  comercioNombre: string,
  guardar = true,
) {
  const sesion = await getStoredSession();
  if (!sesion || !sesion.usuario.avisosActivos) return false;
  const hasta = Date.parse(promo.hasta);
  if (!promo.activa || hasta <= Date.now()) return false;
  if (!(await configurarNotificaciones())) return false;
  const clave = `promos_guardadas:${sesion.usuario.id}`;
  if (guardar) {
    const anteriores: Guardada[] = JSON.parse((await getKV(clave)) ?? "[]");
    await setKV(
      clave,
      JSON.stringify([
        ...anteriores.filter((p) => p.promo.id !== promo.id),
        { promo, comercioNombre },
      ]),
    );
  }
  const cuando = Math.max(Date.now() + 1000, hasta - 24 * 60 * 60 * 1000);
  if (cuando >= hasta) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: `vence:${sesion.usuario.id}:${promo.id}`,
    content: {
      title: "Tu promoción guardada está por vencer",
      body: `Aprovechá "${promo.titulo}" en ${comercioNombre}.`,
      data: { comercioId: promo.comercioId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(cuando),
    },
  });
  return true;
}

export async function restaurarRecordatorios(usuarioId: string) {
  const clave = `promos_guardadas:${usuarioId}`;
  const original = (await getKV(clave)) ?? "[]";
  const guardadas: Guardada[] = JSON.parse(original);
  const conservar: Guardada[] = [];
  for (const g of guardadas) {
    if ((await getStoredSession())?.usuario.id !== usuarioId) return;
    try {
      const { data } = await api.get<ApiRespuesta<Promocion>>(
        `/promociones/${encodeURIComponent(g.promo.id)}`,
      );
      g.promo = data.datos;
    } catch (e) {
      if (isAxiosError(e) && [404, 410].includes(e.response?.status ?? 0)) {
        await Notifications.cancelScheduledNotificationAsync(
          `vence:${usuarioId}:${g.promo.id}`,
        );
        continue;
      }
    }
    if (!g.promo.activa || Date.parse(g.promo.hasta) <= Date.now()) {
      await Notifications.cancelScheduledNotificationAsync(
        `vence:${usuarioId}:${g.promo.id}`,
      );
      continue;
    }
    conservar.push(g);
    if (Date.parse(g.promo.hasta) - 24 * 60 * 60 * 1000 > Date.now())
      await programarRecordatorioPromoPorVencer(
        g.promo,
        g.comercioNombre,
        false,
      );
  }
  if (((await getKV(clave)) ?? "[]") === original)
    await setKV(clave, JSON.stringify(conservar));
}

export async function cancelarTodasLasNotificaciones() {
  if (Platform.OS !== "web") {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  }
}

export async function registrarAvisosRemotos(): Promise<boolean> {
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (
    !projectId ||
    Platform.OS === "web" ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  )
    return false;
  if (!(await configurarNotificaciones())) return false;
  const { data: tokenExpo } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  await api.post("/dispositivos", { tokenExpo, plataforma: Platform.OS });
  await setKV("dispositivo_push", tokenExpo);
  return true;
}

export async function quitarAvisosRemotos() {
  const token = await getKV("dispositivo_push");
  if (token)
    await api
      .delete(`/dispositivos/${encodeURIComponent(token)}`)
      .catch(() => {});
}
