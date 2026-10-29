import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { guardarFotoEnAlmacenamiento } from "@/src/lib/file-cache";
import {
  formatearHorariosCompletos,
  obtenerEstadoHorario,
} from "@/src/lib/horarios";
import { abrirRutaEnMapas } from "@/src/lib/location";
import { programarRecordatorioPromoPorVencer } from "@/src/lib/notifications";
import { comerciosService } from "@/src/services/comercios.service";
import type { Comercio, Promocion, Resena, UsoDePromocion } from "@/src/types";

export default function ComercioDetailScreen() {
  const { palette: colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario, esFavorito, toggleFavorito } = useAuth();

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

  const [promoSeleccionada, setPromoSeleccionada] = useState<Promocion | null>(null);
  const [usoGenerado, setUsoGenerado] = useState<UsoDePromocion | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [resCom, resProm, resRes] = await Promise.all([
        comerciosService.obtenerComercioPorId(id),
        comerciosService.obtenerPromociones({ comercioId: id }),
        comerciosService.obtenerResenas(id),
      ]);
      setComercio(resCom.datos);
      setPromos(resProm.datos);
      setResenas(resRes.datos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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

  const estado = obtenerEstadoHorario(comercio.horarios, comercio.activo);
  const horariosCompletos = formatearHorariosCompletos(comercio.horarios);
  const favorito = esFavorito(comercio.id);

  async function handleToggleFavorito() {
    if (!usuario) {
      router.push("/login");
      return;
    }
    await toggleFavorito(comercio!.id);
  }

  async function tomarOSeleccionarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso necesario", "Se necesita permiso de cámara para sacar fotos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const guardada = await guardarFotoEnAlmacenamiento(
        result.assets[0].uri,
        `resena_${id}.jpg`
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
        await comerciosService.editarResena(resenaEditandoId, datos);
      } else {
        await comerciosService.crearResena(comercio!.id, datos);
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
    setFotoUri(null);
    setModalResenaVisible(true);
  }

  async function handleEliminarResena(resenaId: string) {
    Alert.alert("Borrar reseña", "¿Seguro querés borrar tu reseña?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          await comerciosService.eliminarResena(resenaId);
          await cargar();
        },
      },
    ]);
  }

  async function handleReportarResena(resenaId: string) {
    Alert.alert("Reportar", "¿Deseás reportar esta reseña como ofensiva?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Reportar",
        onPress: async () => {
          await comerciosService.reportarResena(resenaId);
          Alert.alert("Gracias", "La reseña fue reportada y enviada a moderación.");
          await cargar();
        },
      },
    ]);
  }

  async function handleMostrarCodigo(promo: Promocion) {
    if (!usuario) {
      router.push("/login");
      return;
    }
    setPromoSeleccionada(promo);
    const uso = await comerciosService.generarCodigoUso(promo.id);
    setUsoGenerado(uso);
    if (usuario.avisosActivos) {
      programarRecordatorioPromoPorVencer(promo, comercio?.nombre ?? "el comercio");
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
        {comercio.videoUrl ? (
          <ComercioVideo videoUrl={comercio.videoUrl} />
        ) : comercio.imagenes && comercio.imagenes.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {comercio.imagenes.map((img, i) => (
              <Image key={i} source={img} style={styles.image} contentFit="cover" transition={200} />
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
                  `https://instagram.com/${comercio.instagram?.replace("@", "")}`
                )
              }
            />
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.accent} />
            <ThemedText style={styles.flex}>{comercio.direccion}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={estado.abierto ? "#2e7d32" : "#c62828"} />
            <ThemedText style={{ fontWeight: "600", color: estado.abierto ? "#2e7d32" : "#c62828" }}>
              {estado.texto}
            </ThemedText>
          </View>

          {horariosCompletos.length > 0 && (
            <View style={styles.horariosList}>
              {horariosCompletos.map((h, i) => (
                <ThemedText key={i} style={[styles.small, { color: colors.muted }]}>
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
                  <View key={idx} style={[styles.payChip, { borderColor: colors.border }]}>
                    <ThemedText style={styles.small}>{medio}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {promos.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle">Promociones vigentes</ThemedText>
            {promos.map((promo) => (
              <View
                key={promo.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
                  <Button
                    title="Mostrar mi código"
                    size="small"
                    icon="qr-code"
                    onPress={() => handleMostrarCodigo(promo)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <ThemedText type="subtitle">Reseñas</ThemedText>
            <Button
              title="Dejar opinión"
              size="small"
              icon="star-outline"
              onPress={() => {
                if (!usuario) router.push("/login");
                else {
                  setResenaEditandoId(null);
                  setEstrellasNueva(5);
                  setComentarioNuevo("");
                  setModalResenaVisible(true);
                }
              }}
            />
          </View>

          {resenas.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>
              Sé el primero en opinar sobre este local.
            </ThemedText>
          ) : (
            resenas.map((r) => {
              const esPropia = usuario && usuario.id === r.usuarioId;
              return (
                <View
                  key={r.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.rowBetween}>
                    <ThemedText type="defaultSemiBold">
                      {r.usuarioNombre ?? "Vecino"}
                    </ThemedText>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#f5a623" />
                      <ThemedText style={styles.small}>{r.estrellas}</ThemedText>
                    </View>
                  </View>

                  <ThemedText>{r.comentario}</ThemedText>

                  {r.fotoUrl && (
                    <Image source={r.fotoUrl} style={styles.resenaFoto} contentFit="cover" />
                  )}

                  {r.respuesta && (
                    <View style={[styles.respuestaBox, { backgroundColor: colors.background }]}>
                      <ThemedText style={[styles.small, { fontWeight: "bold" }]}>
                        Respuesta del comercio:
                      </ThemedText>
                      <ThemedText style={styles.small}>{r.respuesta}</ThemedText>
                    </View>
                  )}

                  <View style={styles.resenaFooter}>
                    <ThemedText style={[styles.small, { color: colors.muted }]}>
                      {new Date(r.creadaEn).toLocaleDateString("es-AR")}
                    </ThemedText>
                    <View style={styles.resenaActions}>
                      {esPropia ? (
                        <>
                          <Pressable onPress={() => handleEditarResena(r)} hitSlop={8}>
                            <ThemedText style={[styles.small, { color: colors.accent }]}>
                              Editar
                            </ThemedText>
                          </Pressable>
                          <Pressable onPress={() => handleEliminarResena(r.id)} hitSlop={8}>
                            <ThemedText style={[styles.small, { color: "#d32f2f" }]}>
                              Borrar
                            </ThemedText>
                          </Pressable>
                        </>
                      ) : (
                        <Pressable onPress={() => handleReportarResena(r.id)} hitSlop={8}>
                          <ThemedText style={[styles.small, { color: colors.muted }]}>
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
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              onChangeText={setComentarioNuevo}
              placeholder="Contanos tu experiencia..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            />

            <Button
              title={fotoUri ? "Cambiar foto" : "Sacar foto con cámara"}
              variant="secondary"
              icon="camera"
              size="small"
              onPress={tomarOSeleccionarFoto}
            />

            {fotoUri && (
              <Image source={fotoUri} style={styles.previewFoto} contentFit="cover" />
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
        visible={promoSeleccionada !== null}
        animationType="fade"
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
            <View style={[styles.codeBox, { borderColor: colors.border }]}>
              <Ionicons name="qr-code-outline" size={70} color={colors.accent} />
              <ThemedText type="subtitle" style={{ color: colors.accent, letterSpacing: 2 }}>
                {usoGenerado ? usoGenerado.codigo : "..."}
              </ThemedText>
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
