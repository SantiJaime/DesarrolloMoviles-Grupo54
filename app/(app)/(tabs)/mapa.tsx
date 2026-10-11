import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";

import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { useThemeColors } from "@/src/hooks/use-theme-color";
import { obtenerEstadoHorario } from "@/src/lib/horarios";
import {
  abrirRutaEnMapas,
  pedirPermisoYUbicacion,
} from "@/src/lib/location";
import { comerciosService } from "@/src/servicios/comercios";
import type { Comercio, Coordenadas, Rubro } from "@/src/tipos";

const CENTRO_CDELU: Coordenadas = {
  latitud: -32.484,
  longitud: -58.233,
};

export default function MapaScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [loading, setLoading] = useState(true);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<Coordenadas | null>(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);
  const [rubroFiltro, setRubroFiltro] = useState<string | null>(null);
  const [comercioSeleccionado, setComercioSeleccionado] = useState<Comercio | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [resCom, resRubros] = await Promise.all([
        comerciosService.obtenerComercios(),
        comerciosService.obtenerRubros(),
      ]);
      setComercios(resCom.datos);
      setRubros(resRubros.datos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    pedirPermisoYUbicacion().then((coords) => {
      if (coords) setUbicacionUsuario(coords);
      else setPermisoDenegado(true);
    });
  }, [cargar]);

  const filtrados = rubroFiltro
    ? comercios.filter((c) => c.rubroId === rubroFiltro)
    : comercios;

  if (loading) {
    return <StateView type="loading" message="Cargando mapa..." />;
  }

  return (
    <ThemedView style={styles.flex}>
      <View style={styles.filterOverlay}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rubrosList}
        >
          <Pressable
            onPress={() => setRubroFiltro(null)}
            style={[
              styles.chip,
              {
                backgroundColor: rubroFiltro === null ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: rubroFiltro === null ? colors.onTint : colors.text },
              ]}
            >
              Todos
            </ThemedText>
          </Pressable>
          {rubros.map((r) => {
            const activo = rubroFiltro === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRubroFiltro(activo ? null : r.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: activo ? colors.tint : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: activo ? colors.onTint : colors.text },
                  ]}
                >
                  {r.nombre}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {permisoDenegado && (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle" size={16} color="#fff" />
          <ThemedText style={styles.warningText}>
            Ubicación desactivada. Podés explorar los comercios en el mapa manualmente.
          </ThemedText>
        </View>
      )}

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: ubicacionUsuario ? ubicacionUsuario.latitud : CENTRO_CDELU.latitud,
          longitude: ubicacionUsuario ? ubicacionUsuario.longitud : CENTRO_CDELU.longitud,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={Boolean(ubicacionUsuario)}
      >
        {filtrados.map((comercio) => {
          const rubro = rubros.find((r) => r.id === comercio.rubroId);
          const pinColor = rubro?.color || "#E65100";

          return (
            <Marker
              key={comercio.id}
              coordinate={{
                latitude: comercio.coordenadas.latitud,
                longitude: comercio.coordenadas.longitud,
              }}
              title={comercio.nombre}
              description={comercio.direccion}
              pinColor={pinColor}
              onPress={() => setComercioSeleccionado(comercio)}
            />
          );
        })}
      </MapView>

      {comercioSeleccionado && (
        <View
          style={[
            styles.cardBottom,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <ThemedText type="defaultSemiBold">
                {comercioSeleccionado.nombre}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                {comercioSeleccionado.direccion}
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: obtenerEstadoHorario(
                    comercioSeleccionado.horarios,
                    comercioSeleccionado.activo
                  ).abierto
                    ? "#2e7d32"
                    : "#c62828",
                }}
              >
                {
                  obtenerEstadoHorario(
                    comercioSeleccionado.horarios,
                    comercioSeleccionado.activo
                  ).texto
                }
              </ThemedText>
            </View>
            <Pressable onPress={() => setComercioSeleccionado(null)} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            <Button
              title="Cómo llegar"
              variant="secondary"
              icon="navigate"
              size="small"
              onPress={() =>
                abrirRutaEnMapas(
                  comercioSeleccionado.coordenadas,
                  comercioSeleccionado.nombre
                )
              }
            />
            <Button
              title="Ver ficha"
              size="small"
              icon="open-outline"
              onPress={() =>
                router.push({
                  pathname: "/comercio/[id]",
                  params: { id: comercioSeleccionado.id },
                })
              }
            />
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  filterOverlay: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  rubrosList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  warningBanner: {
    position: "absolute",
    top: 54,
    left: 12,
    right: 12,
    zIndex: 9,
    backgroundColor: "#616161",
    padding: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    color: "#fff",
    fontSize: 11,
    flex: 1,
  },
  cardBottom: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
});
