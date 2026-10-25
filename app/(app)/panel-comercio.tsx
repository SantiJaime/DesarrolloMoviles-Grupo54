import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { TextField } from "@/src/components/ui/text-field";
import { useAuth } from "@/src/hooks/use-auth";
import { useTheme } from "@/src/hooks/use-theme";
import { guardarFotoEnAlmacenamiento } from "@/src/lib/file-cache";
import { archivosService } from "@/src/services/archivos.service";
import { comerciosService } from "@/src/services/comercios.service";
import type { Comercio, Promocion, Resena } from "@/src/types";

export default function PanelComercioScreen() {
  const { palette: colors } = useTheme();
  const router = useRouter();
  const { usuario } = useAuth();

  const comercioId = usuario?.comercioId ?? "com-118";
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalPromo, setModalPromo] = useState(false);
  const [promoTitulo, setPromoTitulo] = useState("");
  const [promoDetalle, setPromoDetalle] = useState("");
  const [promoDescuento, setPromoDescuento] = useState("");
  const [creandoPromo, setCreandoPromo] = useState(false);

  const [modalRespuesta, setModalRespuesta] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");

  const [editandoDatos, setEditandoDatos] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [resCom, resProm, resRes] = await Promise.all([
        comerciosService.obtenerComercioPorId(comercioId),
        comerciosService.obtenerPromociones({ comercioId }),
        comerciosService.obtenerResenas(comercioId),
      ]);
      setComercio(resCom.datos);
      setPromos(resProm.datos);
      setResenas(resRes.datos);

      setFormNombre(resCom.datos.nombre);
      setFormDireccion(resCom.datos.direccion);
      setFormTelefono(resCom.datos.telefono ?? "");
      setFormWhatsapp(resCom.datos.whatsapp ?? "");
      setFormDesc(resCom.datos.descripcion);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [comercioId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (loading) return <StateView type="loading" />;
  if (error && !comercio) {
    return (
      <StateView
        type="error"
        title="No pudimos cargar el panel"
        message={error}
        actionLabel="Reintentar"
        onAction={() => {
          setLoading(true);
          cargar();
        }}
      />
    );
  }
  if (!comercio) return <StateView type="empty" title="Comercio no encontrado" />;

  async function handleGuardarDatos() {
    setGuardandoDatos(true);
    try {
      await comerciosService.actualizarComercio({
        nombre: formNombre,
        direccion: formDireccion,
        telefono: formTelefono || null,
        whatsapp: formWhatsapp || null,
        descripcion: formDesc,
      });
      setEditandoDatos(false);
      await cargar();
      Alert.alert("Éxito", "Los datos del comercio fueron actualizados.");
    } finally {
      setGuardandoDatos(false);
    }
  }

  async function handleSubirFoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const local = await guardarFotoEnAlmacenamiento(
        result.assets[0].uri,
        `comercio_${comercioId}.jpg`
      );
      const subido = await archivosService.subir(local, `comercio_${comercioId}.jpg`);
      await comerciosService.actualizarComercio({
        imagenes: [subido.url, ...comercio!.imagenes].slice(0, 8),
      });
      await cargar();
    }
  }

  async function handleCrearPromo() {
    if (!promoTitulo.trim()) {
      Alert.alert("Atención", "Ingresá un título para la promoción.");
      return;
    }
    setCreandoPromo(true);
    try {
      const hoy = new Date();
      const mesProximo = new Date();
      mesProximo.setDate(hoy.getDate() + 30);

      await comerciosService.crearPromocion({
        titulo: promoTitulo.trim(),
        detalle: promoDetalle.trim(),
        descuento: promoDescuento ? Number(promoDescuento) : null,
        desde: hoy.toISOString(),
        hasta: mesProximo.toISOString(),
        imagenUrl: null,
        soloApp: true,
      });
      setModalPromo(false);
      setPromoTitulo("");
      setPromoDetalle("");
      setPromoDescuento("");
      await cargar();
    } finally {
      setCreandoPromo(false);
    }
  }

  async function handleDarDeBajaPromo(promoId: string) {
    Alert.alert("Dar de baja", "¿Deseás dar de baja esta promoción?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Dar de baja",
        style: "destructive",
        onPress: async () => {
          await comerciosService.darDeBajaPromocion(promoId);
          await cargar();
        },
      },
    ]);
  }

  async function handleEnviarRespuesta(resenaId: string) {
    if (!textoRespuesta.trim()) return;
    try {
      await comerciosService.responderResena(resenaId, textoRespuesta.trim());
      setModalRespuesta(null);
      setTextoRespuesta("");
      await cargar();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topActions}>
          <Button
            title="Escanear cupón en mostrador"
            icon="qr-code"
            onPress={() => router.push("/scan")}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <ThemedText type="subtitle">Datos del comercio</ThemedText>
            <Button
              title={editandoDatos ? "Cancelar" : "Editar"}
              variant="secondary"
              size="small"
              onPress={() => setEditandoDatos(!editandoDatos)}
            />
          </View>

          {editandoDatos ? (
            <View style={styles.form}>
              <TextField label="Nombre del local" value={formNombre} onChangeText={setFormNombre} />
              <TextField label="Dirección" value={formDireccion} onChangeText={setFormDireccion} />
              <TextField label="Teléfono" value={formTelefono} onChangeText={setFormTelefono} />
              <TextField label="WhatsApp" value={formWhatsapp} onChangeText={setFormWhatsapp} />
              <TextField label="Descripción" multiline value={formDesc} onChangeText={setFormDesc} />
              <Button title="Guardar cambios" loading={guardandoDatos} onPress={handleGuardarDatos} />
            </View>
          ) : (
            <View style={styles.gap}>
              <ThemedText type="defaultSemiBold">{comercio.nombre}</ThemedText>
              <ThemedText style={{ color: colors.muted }}>{comercio.direccion}</ThemedText>
              <ThemedText style={styles.desc}>{comercio.descripcion}</ThemedText>
              <Button
                title="Agregar foto a galería"
                variant="secondary"
                icon="image-outline"
                size="small"
                onPress={handleSubirFoto}
              />
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <ThemedText type="subtitle">Promociones vigentes</ThemedText>
            <Button
              title="Nueva promo"
              size="small"
              icon="add-outline"
              onPress={() => setModalPromo(true)}
            />
          </View>

          {promos.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>
              No tenés promociones activas.
            </ThemedText>
          ) : (
            promos.map((p) => (
              <View key={p.id} style={[styles.itemBox, { borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <ThemedText type="defaultSemiBold">{p.titulo}</ThemedText>
                  <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
                    {p.usos} canjes
                  </ThemedText>
                </View>
                <ThemedText style={{ color: colors.muted, fontSize: 13 }}>{p.detalle}</ThemedText>
                <View style={styles.rowBetween}>
                  <ThemedText style={styles.small}>
                    Hasta {new Date(p.hasta).toLocaleDateString("es-AR")}
                  </ThemedText>
                  <Button
                    title="Dar de baja"
                    variant="danger"
                    size="small"
                    onPress={() => handleDarDeBajaPromo(p.id)}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText type="subtitle">Reseñas de clientes</ThemedText>
          {resenas.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>Sin reseñas aún.</ThemedText>
          ) : (
            resenas.map((r) => (
              <View key={r.id} style={[styles.itemBox, { borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <ThemedText type="defaultSemiBold">{r.usuarioNombre ?? "Cliente"}</ThemedText>
                  <ThemedText style={styles.small}>★ {r.estrellas}</ThemedText>
                </View>
                <ThemedText>{r.comentario}</ThemedText>

                {r.respuesta ? (
                  <View style={[styles.respBox, { backgroundColor: colors.background }]}>
                    <ThemedText style={[styles.small, { fontWeight: "bold" }]}>Tu respuesta:</ThemedText>
                    <ThemedText style={styles.small}>{r.respuesta}</ThemedText>
                  </View>
                ) : (
                  <Button
                    title="Responder a este cliente"
                    variant="secondary"
                    size="small"
                    icon="chatbubble-outline"
                    onPress={() => {
                      setModalRespuesta(r.id);
                      setTextoRespuesta("");
                    }}
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalPromo}
        animationType="slide"
        transparent
        onRequestClose={() => setModalPromo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <ThemedText type="subtitle">Crear Promoción</ThemedText>
            <TextField label="Título" placeholder="Ej: 15% en pinturas" value={promoTitulo} onChangeText={setPromoTitulo} />
            <TextField label="Detalle o condiciones" placeholder="Condiciones del beneficio..." multiline value={promoDetalle} onChangeText={setPromoDetalle} />
            <TextField label="Porcentaje de descuento (opcional)" keyboardType="numeric" placeholder="15" value={promoDescuento} onChangeText={setPromoDescuento} />
            <View style={styles.rowBetween}>
              <Button title="Cancelar" variant="secondary" onPress={() => setModalPromo(false)} />
              <Button title="Crear" loading={creandoPromo} onPress={handleCrearPromo} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalRespuesta !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalRespuesta(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <ThemedText type="subtitle">Responder Reseña</ThemedText>
            <TextInput
              value={textoRespuesta}
              onChangeText={setTextoRespuesta}
              placeholder="Escribí una respuesta formal para tu cliente..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            />
            <View style={styles.rowBetween}>
              <Button title="Cancelar" variant="secondary" onPress={() => setModalRespuesta(null)} />
              <Button title="Enviar respuesta" onPress={() => handleEnviarRespuesta(modalRespuesta!)} />
            </View>
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
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  topActions: {
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gap: {
    gap: 6,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 10,
    marginTop: 8,
  },
  itemBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
  badgeText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  respBox: {
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    gap: 2,
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
    gap: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  small: {
    fontSize: 12,
  },
});
