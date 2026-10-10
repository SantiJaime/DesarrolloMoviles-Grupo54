import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { StateView } from '@/src/components/state-view';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { comerciosService } from '@/src/services/comercios.service';
import type { Comercio } from '@/src/types/models';

export default function HomeScreen() {
  const colors = useThemeColors();
  const [comercios, setComercios] = useState<Comercio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function load() {
    setError(null);
    setComercios(null);
    try {
      setComercios(await comerciosService.list());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return <StateView type="error" title="No se pudo cargar el directorio" message={error} actionLabel="Reintentar" onAction={load} />;
  }
  if (!comercios) {
    return <StateView type="loading" message="Cargando comercios..." />;
  }

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? comercios.filter(
        (c) => c.nombre.toLowerCase().includes(normalized) || c.rubro?.nombre.toLowerCase().includes(normalized),
      )
    : comercios;

  return (
    <ThemedView style={styles.flex}>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={22} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar comercio o rubro"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ComercioCard comercio={item} />}
        ListEmptyComponent={
          <StateView
            type="empty"
            title="Sin resultados"
            message={`No encontramos comercios para "${query}".`}
            actionLabel="Limpiar búsqueda"
            onAction={() => setQuery('')}
          />
        }
      />
    </ThemedView>
  );
}

function ComercioCard({ comercio }: { comercio: Comercio }) {
  const colors = useThemeColors();

  return (
    <Link href={{ pathname: '/comercio/[id]', params: { id: comercio.id } }} asChild>
      <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={comercio.imagenUrl} style={styles.image} contentFit="cover" transition={200} />
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <ThemedText type="defaultSemiBold" style={styles.flex} numberOfLines={1}>
              {comercio.nombre}
            </ThemedText>
            <MaterialIcons name="star" size={18} color="#f5a623" />
            <ThemedText>
              {comercio.valoracionPromedio.toFixed(1)} ({comercio.totalResenas})
            </ThemedText>
          </View>
          <ThemedText style={{ color: colors.muted }}>
            {comercio.rubro?.nombre ?? 'Sin rubro'} • {comercio.horario}
          </ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 16,
  },
  list: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
