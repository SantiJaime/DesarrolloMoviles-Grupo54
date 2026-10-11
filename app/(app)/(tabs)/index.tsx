import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { useThemeColors } from "@/src/hooks/use-theme-color";
import {
  calcularDistanciaMetros,
  formatearDistancia,
  pedirPermisoYUbicacion,
} from "@/src/lib/location";
import { obtenerEstadoHorario } from "@/src/lib/horarios";
import { useNetworkStatus } from "@/src/lib/network";
import { comerciosService } from "@/src/servicios/comercios";
import type { Comercio, Coordenadas, Promocion, Rubro } from "@/src/tipos";

export default function HomeScreen() {
  const colors = useThemeColors();
  const { isOnline } = useNetworkStatus();

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(null);
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<Coordenadas | null>(null);

  const cargarDatos = useCallback(async () => {
    setError(null);
    try {
      const [resRubros, resComercios, resPromos] = await Promise.all([
        comerciosService.obtenerRubros(),
        comerciosService.obtenerComercios(),
        comerciosService.obtenerPromociones(),
      ]);
      setRubros(resRubros.datos);
      setComercios(resComercios.datos);
      setPromos(resPromos.datos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    pedirPermisoYUbicacion().then((coords) => {
      if (coords) setUbicacionUsuario(coords);
    });
  }, [cargarDatos]);

  if (loading) {
    return <StateView type="loading" message="Cargando comercios..." />;
  }

  if (error) {
    return (
      <StateView
        type="error"
        title="No pudimos cargar los comercios"
        message={error}
        actionLabel="Reintentar"
        onAction={cargarDatos}
      />
    );
  }

  const normalizado = query.trim().toLowerCase();
  let filtrados = comercios.filter((c) => {
    if (rubroSeleccionado && c.rubroId !== rubroSeleccionado) {
      return false;
    }
    if (normalizado) {
      const coincideNombre = c.nombre.toLowerCase().includes(normalizado);
      const coincideDesc = c.descripcion.toLowerCase().includes(normalizado);
      if (!coincideNombre && !coincideDesc) return false;
    }
    if (soloAbiertos) {
      const { abierto } = obtenerEstadoHorario(c.horarios, c.activo);
      if (!abierto) return false;
    }
    return true;
  });

  if (ubicacionUsuario) {
    filtrados = [...filtrados].sort((a, b) => {
      const distA = calcularDistanciaMetros(ubicacionUsuario, a.coordenadas);
      const distB = calcularDistanciaMetros(ubicacionUsuario, b.coordenadas);
      return distA - distB;
    });
  }

  return (
    <ThemedView style={styles.flex}>
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: "#FF9800" }]}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <ThemedText style={styles.offlineText}>
            Sin conexión. Mostrando datos guardados en el teléfono.
          </ThemedText>
        </View>
      )}

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre o lo que venden..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rubrosList}
        >
          <Pressable
            onPress={() => setRubroSeleccionado(null)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  rubroSeleccionado === null ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                {
                  color:
                    rubroSeleccionado === null ? colors.onTint : colors.text,
                },
              ]}
            >
              Todos
            </ThemedText>
          </Pressable>
          {rubros.map((r) => {
            const activo = rubroSeleccionado === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRubroSeleccionado(activo ? null : r.id)}
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

      <View
        style={[
          styles.optionsRow,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.switchContainer}>
          <Switch
            value={soloAbiertos}
            onValueChange={setSoloAbiertos}
            trackColor={{ true: colors.tint }}
          />
          <ThemedText style={styles.optionLabel}>Abierto ahora</ThemedText>
        </View>
        {ubicacionUsuario && (
          <ThemedText style={[styles.optionLabel, { color: colors.muted }]}>
            Ordenado por cercanía
          </ThemedText>
        )}
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const rubro = rubros.find((r) => r.id === item.rubroId);
          const estado = obtenerEstadoHorario(item.horarios, item.activo);
          const distancia = ubicacionUsuario
            ? formatearDistancia(
                calcularDistanciaMetros(ubicacionUsuario, item.coordenadas)
              )
            : null;
          const promo = promos.find((p) => p.comercioId === item.id);

          return (
            <Link
              href={{ pathname: "/comercio/[id]", params: { id: item.id } }}
              asChild
            >
              <Pressable
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {item.imagenes && item.imagenes.length > 0 ? (
                  <Image
                    source={item.imagenes[0]}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View
                    style={[
                      styles.cardImagePlaceholder,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <Ionicons name="storefront" size={40} color={colors.muted} />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="defaultSemiBold" style={styles.flex}>
                      {item.nombre}
                    </ThemedText>
                    {distancia && (
                      <ThemedText style={[styles.distancia, { color: colors.tint }]}>
                        {distancia}
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.row}>
                    <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                      {rubro?.nombre ?? "Comercio"} •{" "}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: estado.abierto ? "#2e7d32" : "#c62828",
                      }}
                    >
                      {estado.texto}
                    </ThemedText>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="star" size={15} color="#f5a623" />
                    <ThemedText style={styles.ratingText}>
                      {item.puntaje > 0
                        ? `${item.puntaje.toFixed(1)} (${item.cantidadResenas})`
                        : "Sin reseñas"}
                    </ThemedText>
                  </View>

                  {promo && (
                    <View style={styles.promoBadge}>
                      <Ionicons name="pricetag" size={13} color="#d32f2f" />
                      <ThemedText style={styles.promoText} numberOfLines={1}>
                        PROMO: {promo.titulo}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Pressable>
            </Link>
          );
        }}
        ListEmptyComponent={
          <StateView
            type="empty"
            title="Sin resultados"
            message={`No encontramos comercios que coincidan con la búsqueda.`}
            actionLabel="Limpiar filtros"
            onAction={() => {
              setQuery("");
              setRubroSeleccionado(null);
              setSoloAbiertos(false);
            }}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterBar: {
    marginVertical: 10,
  },
  rubrosList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 140,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distancia: {
    fontSize: 13,
    fontWeight: "600",
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffebee",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  promoText: {
    color: "#d32f2f",
    fontSize: 12,
    fontWeight: "600",
  },
});
