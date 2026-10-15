import type { Promocion } from "@/src/tipos";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0a7ea4",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

export async function notificarPromoNuevaDeFavorito(
  comercioNombre: string,
  promo: Promocion
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Nueva promoción en ${comercioNombre}`,
        body: `${promo.titulo}: ${promo.detalle}`,
        data: { promoId: promo.id, comercioId: promo.comercioId },
      },
      trigger: null,
    });
  } catch { }
}

export async function programarRecordatorioPromoPorVencer(
  promo: Promocion,
  comercioNombre: string
) {
  try {
    const hasta = new Date(promo.hasta).getTime();
    const ahora = Date.now();
    if (hasta <= ahora) return;

    const avisarEn = hasta - 24 * 60 * 60 * 1000;

    const trigger: Notifications.NotificationTriggerInput =
      avisarEn > ahora
        ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(avisarEn),
        }
        : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
        };

    await Notifications.scheduleNotificationAsync({
      identifier: `promo-vence-${promo.id}`,
      content: {
        title: "¡Tu promoción guardada está por vencer!",
        body: `No te olvides de aprovechar "${promo.titulo}" en ${comercioNombre}.`,
        data: { promoId: promo.id },
      },
      trigger,
    });
  } catch (e) {
    console.log("Error al programar notificación:", e);
  }
}

export async function cancelarTodasLasNotificaciones() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { }
}
