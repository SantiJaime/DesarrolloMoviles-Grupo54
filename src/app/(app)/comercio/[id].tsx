import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "@/src/components/imagen";
import { formatearFechaHora } from "@/src/lib/fechas";
import * as ImagePicker from "expo-image-picker";
import {
  Stack,
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ComercioVideo } from "@/src/components/comercio-video";
import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { useAuth } from "@/src/hooks/use-auth";
import { useTheme } from "@/src/hooks/use-theme";
import {
  guardarFotoEnAlmacenamiento,
  guardarFichaSinConexion,
} from "@/src/lib/file-cache";
import { useNetworkStatus } from "@/src/lib/network";
import { resenasPendientesService } from "@/src/servicios/resenas-pendientes.service";
import { CuponQR } from "@/src/components/cupon-qr";
import { useNow } from "@/src/hooks/use-now";
import { esPromocionVigente } from "@/src/lib/promociones";
import {
  formatearHorariosCompletos,
  obtenerEstadoHorario,
} from "@/src/lib/horarios";
import { abrirRutaEnMapas } from "@/src/lib/location";
import { programarRecordatorioPromoPorVencer } from "@/src/lib/notifications";
import { comerciosService } from "@/src/servicios/comercios.service";
import type { Comercio, Promocion, Resena, UsoDePromocion } from "@/src/tipos";

export default function ComercioDetailScreen() {
  const { palette: colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario, esFavorito, toggleFavorito } = useAuth();
  const { isOnline } = useNetworkStatus();
  const ahora = useNow();
  const usuarioId = usuario?.id;
  const [aviso, setAviso] = useState<string | null>(null);
  const [cacheFecha, setCacheFecha] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalResenaVisible, setModalResenaVisible] = useState(false);
  const [estrellasNueva, setEstrellasNueva] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comentarioNuevo, setComentarioNuevo] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [guardandoResena, setGuardandoResena] = useState(false);
  const [resenaEditandoId, setResenaEditandoId] = useState<string | null>(null);

  const [promoSeleccionada, setPromoSeleccionada] = useState<Promocion | null>(
    null,
  );
  const [usoGenerado, setUsoGenerado] = useState<UsoDePromocion | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAviso(null);
    try {
      if (isOnline) await resenasPendientesService.sincronizar();
      const [resCom, resProm, resRes] = await Promise.all([
        comerciosService.obtenerComercioPorId(id),
        comerciosService
          .obtenerPromociones({ comercioId: id, estado: "vigentes" })
          .catch(() => {
            setAviso(
              "Promociones y reseñas publicadas necesitan conexión. Podés consultar la ficha y guardar una opinión pendiente.",
            );
            return { datos: [] as Promocion[] };
          }),
        comerciosService.obtenerResenas(id).catch(() => {
          setAviso(
            "Promociones y reseñas publicadas necesitan conexión. Podés consultar la ficha y guardar una opinión pendiente.",
          );
          return { datos: [] as Resena[] };
        }),
      ]);
      setComercio(resCom.datos);
      setPromos(resProm.datos);
      setResenas(
        await resenasPendientesService.combinar(
          id,
          resRes.datos,
          usuarioId ?? null,
        ),
      );
      setCacheFecha(resCom.cache?.actualizadoEn ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, usuarioId, isOnline]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (loading) return <StateView type="loading" />;
  if (error || !comercio) {
    return (
      <StateView
        type="error"
        title="No pudimos cargar el comercio"
        message={error ?? "Comercio no encontrado."}
        actionLabel="Reintentar"
        onAction={cargar}
      />
    );
  }

  const estado = obtenerEstadoHorario(
    comercio.horarios,
    comercio.activo,
    new Date(ahora),
  );
  const horariosCompletos = formatearHorariosCompletos(comercio.horarios);
  const favorito = esFavorito(comercio.id);

  async function handleToggleFavorito() {
    if (!usuario) {
      router.push("/login");
      return;
    }
    await toggleFavorito(comercio!.id);
  }

  async function tomarOSeleccionarFoto(galeria = false) {
    const perm = galeria
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permiso necesario",
        "Se necesita permiso de cámara para sacar fotos.",
      );
      return;
    }
    const result = await (
      galeria
        ? ImagePicker.launchImageLibraryAsync
        : ImagePicker.launchCameraAsync
    )({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const guardada = await guardarFotoEnAlmacenamiento(
        result.assets[0].uri,
        `resena_${id}.jpg`,
      );
      setFotoUri(guardada);
    }
  }

  async function handleCrearResena() {
    if (!usuario) {
      router.push("/login");
      return;
    }
    if (!comentarioNuevo.trim()) {
      Alert.alert("Atención", "Escribí un comentario para tu reseña.");
      return;
    }
    setGuardandoResena(true);
    try {
      const datos = {
        estrellas: estrellasNueva,
        comentario: comentarioNuevo.trim(),
      };
      if (resenaEditandoId) {
        const anterior = resenas.find((r) => r.id === resenaEditandoId);
        if (!anterior) throw new Error("No encontramos la reseña para editar.");
        await resenasPendientesService.editar(anterior, datos, fotoUri);
      } else {
        const creada = await resenasPendientesService.crear(
          comercio!.id,
          datos,
          fotoUri,
        );
        if (!creada.sincronizada)
          Alert.alert(
            "Reseña guardada en el teléfono",
            creada.errorSincronizacion ??
              "Se publicará automáticamente cuando haya conexión.",
          );
      }
      setModalResenaVisible(false);
      setComentarioNuevo("");
      setFotoUri(null);
      setResenaEditandoId(null);
      await cargar();
    } catch (e) {
      Alert.alert("No se pudo guardar", (e as Error).message);
    } finally {
      setGuardandoResena(false);
    }
  }

  function handleEditarResena(r: Resena) {
    setResenaEditandoId(r.id);
    setEstrellasNueva(r.estrellas);
    setComentarioNuevo(r.comentario);
    setFotoUri(r.fotoUrl ?? null);
    setModalResenaVisible(true);
  }

  async function handleEliminarResena(resenaId: string) {
    Alert.alert("Borrar reseña", "¿Seguro querés borrar tu reseña?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          try {
            const resena = resenas.find((r) => r.id === resenaId);
            if (resena) await resenasPendientesService.borrar(resena);
            await cargar();
          } catch (e) {
            Alert.alert("No se pudo borrar", (e as Error).message);
          }
        },
      },
    ]);
  }

  async function handleReportarResena(resenaId: string) {
    if (!usuario) {
      router.push("/login");
      return;
    }
    Alert.alert("Reportar", "¿Deseás reportar esta reseña como ofensiva?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Reportar",
        onPress: async () => {
          try {
            await comerciosService.reportarResena(resenaId);
            Alert.alert(
              "Gracias",
              "La reseña fue reportada y enviada a moderación.",
            );
            await cargar();
          } catch (e) {
            Alert.alert("No se pudo reportar", (e as Error).message);
          }
        },
      },
    ]);
  }

  async function handleMostrarCodigo(promo: Promocion) {
    if (!usuario) {
      router.push("/login");
      return;
    }
    if (!esPromocionVigente(promo)) {
      Alert.alert(
        "Promoción no disponible",
        "Esta promoción todavía no empezó o ya venció.",
      );
      return;
    }
    setUsoGenerado(null);
    setGenerandoCodigo(true);
    setPromoSeleccionada(promo);
    try {
      const uso = await comerciosService.generarCodigoUso(promo.id);
      setUsoGenerado(uso);
      if (usuario.avisosActivos) {
        await programarRecordatorioPromoPorVencer(
          promo,
          comercio?.nombre ?? "el comercio",
        );
      }
    } catch (e) {
      setPromoSeleccionada(null);
      Alert.alert(promo.titulo, (e as Error).message);
    } finally {
      setGenerandoCodigo(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          title: comercio.nombre,
          headerRight: () => (
            <Pressable onPress={handleToggleFavorito} hitSlop={10}>
              <Ionicons
                name={favorito ? "heart" : "heart-outline"}
                size={24}
                color={favorito ? "#e91e63" : colors.text}
              />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {cacheFecha !== null && (
          <ThemedText style={{ padding: 16 }}>
            Ficha guardada
            {cacheFecha
              ? ` el ${formatearFechaHora(cacheFecha)}`
              : " en el teléfono"}
            . Los datos pueden estar desactualizados.
          </ThemedText>
        )}
        {aviso && <ThemedText style={{ padding: 16 }}>{aviso}</ThemedText>}
        <Button
          title="Guardar fotos y video sin conexión"
          icon="download-outline"
          loading={descargando}
          disabled={!isOnline}
          onPress={async () => {
            if (!comercio.videoUrl && !comercio.imagenes?.length) {
              Alert.alert(
                "Sin multimedia",
                "Este comercio todavía no tiene fotos ni video para guardar.",
              );
              return;
            }
            setDescargando(true);
            try {
              setComercio(await guardarFichaSinConexion(comercio));
              Alert.alert(
                "Ficha guardada",
                "Las fotos y el video ya están disponibles en este teléfono sin conexión.",
              );
            } catch (e) {
              Alert.alert(
                "No se pudo guardar la multimedia",
                (e as Error).message,
              );
            } finally {
              setDescargando(false);
            }
          }}
        />
        {comercio.videoUrl ? (
          <ComercioVideo videoUrl={comercio.videoUrl} />
        ) : null}
        {comercio.imagenes && comercio.imagenes.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
          >
            {comercio.imagenes.map((img, i) => (
              <Image
                key={i}
                source={img}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.headerSection}>
          <ThemedText type="title">{comercio.nombre}</ThemedText>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color="#f5a623" />
            <ThemedText style={{ fontWeight: "600" }}>
              {comercio.puntaje > 0 ? comercio.puntaje.toFixed(1) : "Nuevo"}
            </ThemedText>
            <ThemedText style={{ color: colors.muted }}>
              ({comercio.cantidadResenas} reseñas)
            </ThemedText>
          </View>
          <ThemedText style={styles.desc}>{comercio.descripcion}</ThemedText>
        </View>

        <View style={styles.actionButtonsRow}>
          {comercio.telefono && (
            <Button
              title="Llamar"
              variant="secondary"
              icon="call"
              size="small"
              onPress={() => Linking.openURL(`tel:${comercio.telefono}`)}
            />
          )}
          {comercio.whatsapp && (
            <Button
              title="WhatsApp"
              variant="secondary"
              icon="logo-whatsapp"
              size="small"
              onPress={() =>
                Linking.openURL(`https://wa.me/${comercio.whatsapp}`)
              }
            />
          )}
          <Button
            title="Ir"
            variant="secondary"
            icon="navigate"
            size="small"
            onPress={() =>
              abrirRutaEnMapas(comercio.coordenadas, comercio.nombre)
            }
          />
          {comercio.instagram && (
            <Button
              title="Instagram"
              variant="secondary"
              icon="logo-instagram"
              size="small"
              onPress={() =>
                Linking.openURL(
                  `https://instagram.com/${comercio.instagram?.replace("@", "")}`,
                )
              }
            />
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.accent} />
            <ThemedText style={styles.flex}>{comercio.direccion}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={20}
              color={estado.abierto ? "#2e7d32" : "#c62828"}
            />
            <ThemedText
              style={{
                fontWeight: "600",
                color: estado.abierto ? "#2e7d32" : "#c62828",
              }}
            >
              {estado.texto}
            </ThemedText>
          </View>

          {horariosCompletos.length > 0 && (
            <View style={styles.horariosList}>
              {horariosCompletos.map((h, i) => (
                <ThemedText
                  key={i}
                  style={[styles.small, { color: colors.muted }]}
                >
                  {h}
                </ThemedText>
              ))}
            </View>
          )}

          {comercio.mediosDePago.length > 0 && (
            <View style={styles.mediosPagoSection}>
              <ThemedText style={[styles.small, { fontWeight: "600" }]}>
                Medios de pago aceptados:
              </ThemedText>
              <View style={styles.chipsWrap}>
                {comercio.mediosDePago.map((medio, idx) => (
                  <View
                    key={idx}
                    style={[styles.payChip, { borderColor: colors.border }]}
                  >
                    <ThemedText style={styles.small}>{medio}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {promos.some((p) => esPromocionVigente(p, ahora)) && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionPad}>
              Promociones vigentes
            </ThemedText>
            {promos
              .filter((p) => esPromocionVigente(p, ahora))
              .map((promo) => (
                <View
                  key={promo.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <ThemedText type="defaultSemiBold" style={styles.flex}>
                      {promo.titulo}
                    </ThemedText>
                    {promo.descuento && (
                      <View style={styles.promoBadge}>
                        <ThemedText style={styles.promoBadgeText}>
                          {promo.descuento}% OFF
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                    {promo.detalle}
                  </ThemedText>
                  <View style={styles.rowBetween}>
                    <ThemedText style={styles.small}>
                      Hasta {new Date(promo.hasta).toLocaleDateString("es-AR")}
                    </ThemedText>
                    {promo.soloApp ? (
                      <Button
                        title="Mostrar mi código"
                        size="small"
                        icon="qr-code"
                        onPress={() => handleMostrarCodigo(promo)}
                        loading={
                          generandoCodigo && promoSeleccionada?.id === promo.id
                        }
                        disabled={generandoCodigo}
                      />
                    ) : (
                      <ThemedText>Se aplica en el local</ThemedText>
                    )}
                  </View>
                </View>
              ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={[styles.rowBetween, styles.sectionPad]}>
            <ThemedText type="subtitle">Reseñas</ThemedText>
            <Button
              title={
                resenas.some((r) => r.usuarioId === usuario?.id)
                  ? "Editar mi opinión"
                  : "Dejar opinión"
              }
              size="small"
              icon="star-outline"
              onPress={() => {
                if (!usuario) router.push("/login");
                else if (usuario.rol !== "vecino")
                  Alert.alert(
                    "Cuenta de vecino",
                    "Las opiniones las publican los vecinos.",
                  );
                else {
                  const propia = resenas.find(
                    (r) => r.usuarioId === usuario.id,
                  );
                  if (propia) {
                    handleEditarResena(propia);
                    return;
                  }
                  setResenaEditandoId(null);
                  setEstrellasNueva(5);
                  setComentarioNuevo("");
                  setFotoUri(null);
                  setModalResenaVisible(true);
                }
              }}
            />
          </View>

          {resenas.length === 0 ? (
            <ThemedText style={[styles.sectionPad, { color: colors.muted }]}>
              Sé el primero en opinar sobre este local.
            </ThemedText>
          ) : (
            resenas.map((r) => {
              const esPropia = usuario && usuario.id === r.usuarioId;
              return (
                <View
                  key={r.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <ThemedText type="defaultSemiBold">
                      {r.usuarioNombre ?? "Vecino"}
                    </ThemedText>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#f5a623" />
                      <ThemedText style={styles.small}>
                        {r.estrellas}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText>{r.comentario}</ThemedText>
                  {!r.sincronizada && (
                    <ThemedText style={{ color: colors.accent }}>
                      Pendiente de publicación
                      {r.errorSincronizacion
                        ? `: ${r.errorSincronizacion}`
                        : ". Se enviará al recuperar conexión."}
                    </ThemedText>
                  )}

                  {r.fotoUrl && (
                    <Image
                      source={r.fotoUrl}
                      style={styles.resenaFoto}
                      contentFit="cover"
                    />
                  )}

                  {r.respuesta && (
                    <View
                      style={[
                        styles.respuestaBox,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <ThemedText
                        style={[styles.small, { fontWeight: "bold" }]}
                      >
                        Respuesta del comercio:
                      </ThemedText>
                      <ThemedText style={styles.small}>
                        {r.respuesta}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.resenaFooter}>
                    <ThemedText style={[styles.small, { color: colors.muted }]}>
                      {new Date(r.creadaEn).toLocaleDateString("es-AR")}
                    </ThemedText>
                    <View style={styles.resenaActions}>
                      {esPropia ? (
                        <>
                          <Pressable
                            onPress={() => handleEditarResena(r)}
                            hitSlop={8}
                          >
                            <ThemedText
                              style={[styles.small, { color: colors.accent }]}
                            >
                              Editar
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            onPress={() => handleEliminarResena(r.id)}
                            hitSlop={8}
                          >
                            <ThemedText
                              style={[styles.small, { color: "#d32f2f" }]}
                            >
                              Borrar
                            </ThemedText>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          onPress={() => handleReportarResena(r.id)}
                          hitSlop={8}
                        >
                          <ThemedText
                            style={[styles.small, { color: colors.muted }]}
                          >
                            Reportar
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalResenaVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalResenaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText type="subtitle">
              {resenaEditandoId ? "Editá tu reseña" : "Escribí tu reseña"}
            </ThemedText>
            <View style={styles.starsSelector}>
              {([1, 2, 3, 4, 5] as const).map((num) => (
                <Pressable key={num} onPress={() => setEstrellasNueva(num)}>
                  <Ionicons
                    name={num <= estrellasNueva ? "star" : "star-outline"}
                    size={32}
                    color="#f5a623"
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={comentarioNuevo}
              maxLength={1000}
              onChangeText={setComentarioNuevo}
              placeholder="Contanos tu experiencia..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[
                styles.textArea,
                { color: colors.text, borderColor: colors.border },
              ]}
            />

            <Button
              title={fotoUri ? "Cambiar foto" : "Sacar foto con cámara"}
              variant="secondary"
              icon="camera"
              size="small"
              onPress={() =>
                tomarOSeleccionarFoto().catch((e) =>
                  Alert.alert("Foto", (e as Error).message),
                )
              }
            />
            <Button
              title="Elegir foto de la galería"
              variant="secondary"
              icon="image-outline"
              onPress={() =>
                tomarOSeleccionarFoto(true).catch((e) =>
                  Alert.alert("Foto", (e as Error).message),
                )
              }
            />
            <ThemedText style={styles.small}>
              La foto queda vinculada a tu reseña en este teléfono. La API
              publica la puntuación y el comentario.
            </ThemedText>

            {fotoUri && (
              <Image
                source={fotoUri}
                style={styles.previewFoto}
                contentFit="cover"
              />
            )}

            <View style={styles.rowBetween}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => setModalResenaVisible(false)}
              />
              <Button
                title={resenaEditandoId ? "Guardar" : "Publicar"}
                loading={guardandoResena}
                onPress={handleCrearResena}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          promoSeleccionada !== null &&
          esPromocionVigente(promoSeleccionada, ahora)
        }
        animationType="fade"
        transparent
        onRequestClose={() => {
          setPromoSeleccionada(null);
          setUsoGenerado(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <ThemedText type="title" style={styles.center}>
              Cupón de Descuento
            </ThemedText>
            <ThemedText style={[styles.center, { color: colors.muted }]}>
              {promoSeleccionada?.titulo}
            </ThemedText>
            <View style={[styles.codeBox, { borderColor: colors.border }]}>
              <CuponQR codigo={usoGenerado?.codigo} />
            </View>
            <Button
              title="Cerrar"
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
  container: {
    paddingBottom: 40,
    gap: 16,
  },
  gallery: {
    width: "100%",
    height: 220,
  },
  image: {
    width: 380,
    height: 220,
  },
  headerSection: {
    paddingHorizontal: 16,
    gap: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  horariosList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
    paddingTop: 8,
    gap: 4,
  },
  mediosPagoSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
    paddingTop: 8,
    gap: 6,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  payChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  section: {
    gap: 12,
  },
  sectionPad: {
    paddingHorizontal: 16,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoBadge: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promoBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  resenaFoto: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginTop: 6,
  },
  respuestaBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  resenaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  resenaActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  starsSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  previewFoto: {
    width: "100%",
    height: 120,
    borderRadius: 8,
  },
  codeBox: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  center: {
    textAlign: "center",
  },
  small: {
    fontSize: 12,
  },
});
