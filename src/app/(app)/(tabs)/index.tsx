import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "@/src/components/imagen";
import { formatearFechaHora } from "@/src/lib/fechas";
import { Link, useFocusEffect } from "expo-router";
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
import { useTheme } from "@/src/hooks/use-theme";
import {
  calcularDistanciaMetros,
  formatearDistancia,
  pedirPermisoYUbicacion,
} from "@/src/lib/location";
import { obtenerEstadoHorario } from "@/src/lib/horarios";
import { useNetworkStatus } from "@/src/lib/network";
import { comerciosService } from "@/src/servicios/comercios.service";
import type { Comercio, Coordenadas, Promocion, Rubro } from "@/src/tipos";
import { useNow } from "@/src/hooks/use-now";
import { esPromocionVigente } from "@/src/lib/promociones";

export default function HomeScreen() {
  const { palette: colors } = useTheme();
  const { isOnline } = useNetworkStatus();
  const ahora = useNow();
  const [cacheFecha, setCacheFecha] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(
    null,
  );
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<Coordenadas | null>(
    null,
  );

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAviso(null);
    try {
      const [resRubros, resComercios, resPromos] = await Promise.all([
        comerciosService.obtenerRubros(),
        comerciosService.obtenerComercios(),
        comerciosService
          .obtenerPromociones({ estado: "vigentes" })
          .catch(() => {
            setAviso(
              "Las promociones necesitan conexión. Podés consultar el directorio guardado.",
            );
            return { datos: [] as Promocion[] };
          }),
      ]);
      setRubros(resRubros.datos);
      setComercios(resComercios.datos);
      setPromos(resPromos.datos);
      setCacheFecha(resComercios.cache?.actualizadoEn ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos]),
  );
  useEffect(() => {
    pedirPermisoYUbicacion().then((coords) => {
      if (coords) setUbicacionUsuario(coords);
    });
  }, []);

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

  const normalizar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const normalizado = normalizar(query.trim());
  let filtrados = comercios.filter((c) => {
    if (rubroSeleccionado && c.rubroId !== rubroSeleccionado) {
      return false;
    }
    if (normalizado) {
      const coincideNombre = normalizar(c.nombre).includes(normalizado);
      const coincideDesc = normalizar(c.descripcion).includes(normalizado);
      if (!coincideNombre && !coincideDesc) return false;
    }
    if (soloAbiertos) {
      const { abierto } = obtenerEstadoHorario(
        c.horarios,
        c.activo,
        new Date(ahora),
      );
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
      {(!isOnline || cacheFecha !== null) && (
        <View style={[styles.offlineBanner, { backgroundColor: "#FF9800" }]}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <ThemedText style={styles.offlineText}>
            Datos guardados
            {cacheFecha
              ? ` el ${formatearFechaHora(cacheFecha)}`
              : " en el teléfono"}
            . Pueden estar desactualizados.
          </ThemedText>
        </View>
      )}
      {aviso && (
        <ThemedText
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            fontSize: 13,
            color: colors.muted,
          }}
        >
          {aviso}
        </ThemedText>
      )}

      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
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
                  rubroSeleccionado === null ? colors.accent : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                {
                  color:
                    rubroSeleccionado === null ? colors.onAccent : colors.text,
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
                    backgroundColor: activo ? colors.accent : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: activo ? colors.onAccent : colors.text },
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
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.switchContainer}>
          <Switch
            value={soloAbiertos}
            onValueChange={setSoloAbiertos}
            trackColor={{ true: colors.accent }}
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
          const estado = obtenerEstadoHorario(
            item.horarios,
            item.activo,
            new Date(ahora),
          );
          const distancia = ubicacionUsuario
            ? formatearDistancia(
                calcularDistanciaMetros(ubicacionUsuario, item.coordenadas),
              )
            : null;
          const promo = promos.find(
            (p) => p.comercioId === item.id && esPromocionVigente(p, ahora),
          );

          return (
            <Link
              href={{ pathname: "/comercio/[id]", params: { id: item.id } }}
              asChild
            >
              <Pressable
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
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
                    <Ionicons
                      name="storefront"
                      size={40}
                      color={colors.muted}
                    />
                  </View>
                )}

                <View style={styles.cardBody}>
                  <View style={styles.rowBetween}>
                    <ThemedText type="defaultSemiBold" style={styles.flex}>
                      {item.nombre}
                    </ThemedText>
                    {distancia && (
                      <ThemedText
                        style={[styles.distancia, { color: colors.accent }]}
                      >
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
