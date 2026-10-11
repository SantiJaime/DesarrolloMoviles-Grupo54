import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { useAuth } from "@/src/context/auth-context";
import { useThemeColors } from "@/src/hooks/use-theme-color";
import { comerciosService } from "@/src/servicios/comercios";
import type { Comercio, Promocion, Rubro, UsoDePromocion } from "@/src/tipos";

type TabEstado = "vigentes" | "pronto" | "porVencer";

export default function PromosScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { usuario } = useAuth();

  const [promos, setPromos] = useState<Promocion[]>([]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [loading, setLoading] = useState(true);

  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(null);
  const [tabEstado, setTabEstado] = useState<TabEstado>("vigentes");

  const [promoSeleccionada, setPromoSeleccionada] = useState<Promocion | null>(null);
  const [usoGenerado, setUsoGenerado] = useState<UsoDePromocion | null>(null);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [resPromos, resComercios, resRubros] = await Promise.all([
        comerciosService.obtenerPromociones(),
        comerciosService.obtenerComercios(),
        comerciosService.obtenerRubros(),
      ]);
      setPromos(resPromos.datos);
      setComercios(resComercios.datos);
      setRubros(resRubros.datos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ahora = new Date().getTime();
  const tresDiasMs = 3 * 24 * 60 * 60 * 1000;

  const filtradas = promos.filter((p) => {
    if (!p.activa) return false;
    const desdeMs = new Date(p.desde).getTime();
    const hastaMs = new Date(p.hasta).getTime();

    if (hastaMs < ahora) return false;

    if (tabEstado === "vigentes") {
      if (desdeMs > ahora) return false;
    } else if (tabEstado === "pronto") {
      if (desdeMs <= ahora) return false;
    } else if (tabEstado === "porVencer") {
      if (desdeMs > ahora || hastaMs - ahora > tresDiasMs) return false;
    }

    if (rubroSeleccionado) {
      const com = comercios.find((c) => c.id === p.comercioId);
      if (com?.rubroId !== rubroSeleccionado) return false;
    }

    return true;
  });

  async function handleMostrarCodigo(promo: Promocion) {
    if (!usuario) {
      router.push("/login");
      return;
    }
    setPromoSeleccionada(promo);
    setGenerandoCodigo(true);
    try {
      const nuevoUso = await comerciosService.generarCodigoUso(promo.id, usuario.id);
      setUsoGenerado(nuevoUso);
    } finally {
      setGenerandoCodigo(false);
    }
  }

  if (loading) {
    return <StateView type="loading" message="Cargando promociones..." />;
  }

  return (
    <ThemedView style={styles.flex}>
      <View style={[styles.tabsHeader, { borderColor: colors.border }]}>
        {(["vigentes", "porVencer", "pronto"] as TabEstado[]).map((tab) => {
          const activo = tabEstado === tab;
          const titulos: Record<TabEstado, string> = {
            vigentes: "Vigentes",
            porVencer: "Por vencer",
            pronto: "Arrancan pronto",
          };
          return (
            <Pressable
              key={tab}
              onPress={() => setTabEstado(tab)}
              style={[
                styles.tabBtn,
                activo && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabBtnText,
                  { color: activo ? colors.tint : colors.muted },
                ]}
              >
                {titulos[tab]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.rubrosRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rubrosList}>
          <Pressable
            onPress={() => setRubroSeleccionado(null)}
            style={[
              styles.chip,
              {
                backgroundColor: rubroSeleccionado === null ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: rubroSeleccionado === null ? colors.onTint : colors.text },
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
                <ThemedText style={[styles.chipText, { color: activo ? colors.onTint : colors.text }]}>
                  {r.nombre}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtradas.length === 0 ? (
          <StateView
            type="empty"
            title="No hay promociones en esta categoría"
            message="Probá seleccionando otro rubro o pestaña."
          />
        ) : (
          filtradas.map((promo) => {
            const com = comercios.find((c) => c.id === promo.comercioId);
            const fechaHasta = new Date(promo.hasta).toLocaleDateString("es-AR");

            return (
              <View
                key={promo.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle" style={styles.flex}>
                    {promo.titulo}
                  </ThemedText>
                  {promo.descuento && (
                    <View style={styles.descuentoBadge}>
                      <ThemedText style={styles.descuentoText}>
                        {promo.descuento}% OFF
                      </ThemedText>
                    </View>
                  )}
                </View>

                <ThemedText style={{ color: colors.muted }}>
                  {com ? com.nombre : "Comercio"} • Válida hasta {fechaHasta}
                </ThemedText>

                <ThemedText style={styles.detalle}>{promo.detalle}</ThemedText>

                <View style={styles.footerRow}>
                  <ThemedText style={[styles.usosText, { color: colors.muted }]}>
                    Usada {promo.usos} veces
                  </ThemedText>
                  <Button
                    title="Mostrar mi código"
                    size="small"
                    icon="qr-code"
                    onPress={() => handleMostrarCodigo(promo)}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={promoSeleccionada !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPromoSeleccionada(null);
          setUsoGenerado(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <ThemedText type="title" style={styles.center}>
              Cupón de Descuento
            </ThemedText>
            <ThemedText style={[styles.center, { color: colors.muted }]}>
              {promoSeleccionada?.titulo}
            </ThemedText>

            <View style={[styles.codeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="qr-code-outline" size={80} color={colors.tint} />
              <ThemedText type="subtitle" style={[styles.codeText, { color: colors.tint }]}>
                {usoGenerado ? usoGenerado.codigo : "Generando..."}
              </ThemedText>
              <ThemedText style={[styles.small, { color: colors.muted, textAlign: "center" }]}>
                Presentá este código en el mostrador para aplicar el beneficio.
              </ThemedText>
            </View>

            <Button
              title="Cerrar"
              variant="secondary"
              onPress={() => {
                setPromoSeleccionada(null);
                setUsoGenerado(null);
              }}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rubrosRow: {
    paddingVertical: 8,
  },
  rubrosList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  descuentoBadge: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  descuentoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  detalle: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  usosText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  codeBox: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 10,
  },
  codeText: {
    letterSpacing: 2,
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
  },
  small: {
    fontSize: 12,
  },
});
