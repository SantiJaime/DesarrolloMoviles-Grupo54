import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import type { Coordenadas } from "@/src/types";

export async function pedirPermisoYUbicacion(): Promise<Coordenadas | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitud: loc.coords.latitude,
      longitud: loc.coords.longitude,
    };
  } catch {
    return null;
  }
}

export function calcularDistanciaMetros(
  c1: Coordenadas,
  c2: Coordenadas
): number {
  const R = 6371e3;
  const phi1 = (c1.latitud * Math.PI) / 180;
  const phi2 = (c2.latitud * Math.PI) / 180;
  const deltaPhi = ((c2.latitud - c1.latitud) * Math.PI) / 180;
  const deltaLambda = ((c2.longitud - c1.longitud) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `a ${metros} m`;
  }
  return `a ${(metros / 1000).toFixed(1)} km`;
}

export function abrirRutaEnMapas(coordenadas: Coordenadas, nombre: string) {
  const { latitud, longitud } = coordenadas;
  const esquema = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(nombre)}@${latitud},${longitud}`,
    android: `geo:0,0?q=${latitud},${longitud}(${encodeURIComponent(nombre)})`,
  });

  const urlWeb = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;

  if (esquema) {
    Linking.canOpenURL(esquema)
      .then((soporta) => {
        if (soporta) Linking.openURL(esquema);
        else Linking.openURL(urlWeb);
      })
      .catch(() => Linking.openURL(urlWeb));
  } else {
    Linking.openURL(urlWeb);
  }
}
