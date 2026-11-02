import { useCallback, useState } from "react";
import { Redirect, useFocusEffect } from "expo-router";
import { formatearFechaHora } from "@/src/lib/fechas";
import { ScrollView, View } from "react-native";
import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { CuponQR } from "@/src/components/cupon-qr";
import { useAuth } from "@/src/hooks/use-auth";
import { useNow } from "@/src/hooks/use-now";
import { esPromocionVigente } from "@/src/lib/promociones";
import { comerciosService } from "@/src/servicios/comercios.service";
import type { Promocion, UsoDePromocion } from "@/src/tipos";

export default function HistorialScreen() {
  const { usuario, status } = useAuth();
  const usuarioId = usuario?.id;
  const ahora = useNow();
  const [usos, setUsos] = useState<UsoDePromocion[]>([]);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([
        comerciosService.obtenerMisUsos(),
        comerciosService
          .obtenerPromociones()
          .catch(() => ({ datos: [] as Promocion[] })),
      ]);
      setUsos(
        [...u.datos].sort(
          (a, b) =>
            Date.parse(b.validadoEn ?? "1970-01-01") -
            Date.parse(a.validadoEn ?? "1970-01-01"),
        ),
      );
      setPromos(p.datos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );
  if (status === "loading") return <StateView type="loading" />;
  if (!usuario) return <Redirect href="/login" />;
  if (loading)
    return <StateView type="loading" message="Cargando tus cupones..." />;
  if (error)
    return (
      <StateView
        type="error"
        title="No pudimos cargar los cupones"
        message={error}
        actionLabel="Reintentar"
        onAction={cargar}
      />
    );
  if (!usos.length)
    return (
      <StateView
        type="empty"
        icon="receipt-outline"
        title="Todavía no tenés cupones"
        message="Cuando generes el código de una promoción aparecerá acá."
      />
    );
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
        {usos.map((u) => {
          const promo = promos.find((p) => p.id === u.promocionId);
          return (
            <View key={u.id} style={{ gap: 10 }}>
              <ThemedText type="subtitle">
                {promo?.titulo ?? u.promocionId}
              </ThemedText>
              <ThemedText>
                {u.validadoEn
                  ? `Canjeado el ${formatearFechaHora(u.validadoEn)}`
                  : "Sin canjear"}
              </ThemedText>
              {!u.validadoEn && promo && esPromocionVigente(promo, ahora) ? (
                <CuponQR codigo={u.codigo} />
              ) : (
                <ThemedText selectable>{u.codigo}</ThemedText>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}
