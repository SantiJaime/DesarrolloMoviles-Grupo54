import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { StateView } from '@/src/components/state-view';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { comerciosService } from '@/src/services/comercios.service';
import type { Comercio, Promocion } from '@/src/types/models';

interface DetalleData {
  comercio: Comercio;
  promociones: Promocion[];
}

export default function ComercioDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<DetalleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setData(null);
    try {
      const [comercio, promociones] = await Promise.all([
        comerciosService.getById(id),
        comerciosService.getPromociones(id),
      ]);
      setData({ comercio, promociones });
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <StateView type="error" title="No se pudo cargar el comercio" message={error} actionLabel="Reintentar" onAction={load} />;
  }
  if (!data) {
    return <StateView type="loading" />;
  }

  const { comercio, promociones } = data;

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: comercio.nombre }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={comercio.imagenUrl} style={styles.image} contentFit="cover" transition={200} />

        <View style={styles.section}>
          <ThemedText type="title">{comercio.nombre}</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            {comercio.rubro?.nombre} • ★ {comercio.valoracionPromedio.toFixed(1)} ({comercio.totalResenas} reseñas)
          </ThemedText>
          <ThemedText>{comercio.descripcion}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow icon="place" text={comercio.direccion} />
          <Pressable onPress={() => Linking.openURL(`tel:${comercio.telefono}`)}>
            <InfoRow icon="phone" text={comercio.telefono} link />
          </Pressable>
          <InfoRow icon="schedule" text={comercio.horario} />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Promociones activas</ThemedText>
          {promociones.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>Este comercio no tiene promociones vigentes.</ThemedText>
          ) : (
            promociones.map((promo) => (
              <View key={promo.id} style={[styles.card, { marginHorizontal: 0, backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{promo.titulo}</ThemedText>
                <ThemedText style={{ color: colors.muted }}>{promo.descripcion}</ThemedText>
                <ThemedText style={styles.small}>Válida hasta {promo.fechaValidezHasta}</ThemedText>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({ icon, text, link }: { icon: 'place' | 'phone' | 'schedule'; text: string; link?: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={20} color={colors.tint} />
      <ThemedText type={link ? 'link' : 'default'} style={styles.flex}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    paddingBottom: 32,
    gap: 20,
  },
  image: {
    width: '100%',
    height: 220,
  },
  section: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  small: {
    fontSize: 13,
  },
});
