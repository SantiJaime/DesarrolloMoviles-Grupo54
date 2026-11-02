import * as ImagePicker from "expo-image-picker";
import { Image } from "@/src/components/imagen";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { StateView } from "@/src/components/state-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Button } from "@/src/components/ui/button";
import { TextField } from "@/src/components/ui/text-field";
import { EditorHorarios } from "@/src/components/editor-horarios";
import { ComercioVideo } from "@/src/components/comercio-video";
import { useAuth } from "@/src/hooks/use-auth";
import { useTheme } from "@/src/hooks/use-theme";
import { useNow } from "@/src/hooks/use-now";
import { guardarFotoEnAlmacenamiento } from "@/src/lib/file-cache";
import {
  fechaHoraISO,
  fechaLocal,
  horaLocal,
  validarHorarios,
} from "@/src/lib/formularios";
import { estadoPromocion } from "@/src/lib/promociones";
import { archivosService } from "@/src/servicios/archivos.service";
import { comerciosService } from "@/src/servicios/comercios.service";
import type { Comercio, Horario, Promocion, Resena } from "@/src/tipos";

const pagos = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia",
  billetera_virtual: "Billetera virtual",
};
export default function PanelComercioScreen() {
  const { palette: colors } = useTheme();
  const router = useRouter();
  const { usuario, status } = useAuth();
  const ahora = useNow();
  const comercioId = usuario?.comercioId;
  const rol = usuario?.rol;
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    whatsapp: "",
    instagram: "",
    descripcion: "",
    latitud: "",
    longitud: "",
    cerradoHasta: "",
  });
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horariosModificados, setHorariosModificados] = useState(false);
  const [mediosDePago, setMediosDePago] = useState<string[]>([]);
  const [modalPromo, setModalPromo] = useState(false);
  const [promoId, setPromoId] = useState<string | null>(null);
  const [promo, setPromo] = useState({
    titulo: "",
    detalle: "",
    descuento: "",
    fechaDesde: "",
    horaDesde: "00:00",
    fechaHasta: "",
    horaHasta: "23:59",
    soloApp: true,
    imagenUrl: null as string | null,
  });
  const [responder, setResponder] = useState<Resena | null>(null);
  const [respuesta, setRespuesta] = useState("");

  const cargar = useCallback(async () => {
    if (rol !== "comercio" || !comercioId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [c, p, r] = await Promise.all([
        comerciosService.obtenerMiComercio(),
        comerciosService.obtenerMisPromociones(),
        comerciosService.obtenerResenas(comercioId),
      ]);
      setComercio(c);
      setPromos(p.datos);
      setResenas(r.datos);
      setForm({
        nombre: c.nombre,
        direccion: c.direccion,
        telefono: c.telefono ?? "",
        whatsapp: c.whatsapp ?? "",
        instagram: c.instagram ?? "",
        descripcion: c.descripcion,
        latitud: String(c.coordenadas.latitud),
        longitud: String(c.coordenadas.longitud),
        cerradoHasta: c.cerradoHasta ?? "",
      });
      setHorarios(c.horarios);
      setHorariosModificados(false);
      setMediosDePago(c.mediosDePago);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [comercioId, rol]);
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (status === "loading") return <StateView type="loading" />;
  if (!usuario) return <Redirect href="/login" />;
  if (rol !== "comercio" || !comercioId)
    return (
      <StateView
        type="error"
        title="Cuenta de comercio requerida"
        message="El Centro Comercial habilita las cuentas de sus asociados."
        actionLabel="Volver"
        onAction={() => router.back()}
      />
    );
  if (loading)
    return <StateView type="loading" message="Cargando tu comercio..." />;
  if (!comercio)
    return (
      <StateView
        type="error"
        title="No pudimos cargar el comercio"
        message={error ?? "Intentá nuevamente."}
        actionLabel="Reintentar"
        onAction={() => {
          setLoading(true);
          cargar();
        }}
      />
    );

  const campo = (clave: keyof typeof form, valor: string) =>
    setForm((anterior) => ({ ...anterior, [clave]: valor }));
  async function ejecutar(accion: () => Promise<void>) {
    if (ocupado) return;
    setOcupado(true);
    try {
      await accion();
    } catch (e) {
      Alert.alert("No se pudo completar", (e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function guardarDatos() {
    if (
      !form.nombre.trim() ||
      !form.descripcion.trim() ||
      !form.direccion.trim()
    )
      throw new Error("Completá nombre, dirección y descripción.");
    const latitud = Number(form.latitud.replace(",", ".")),
      longitud = Number(form.longitud.replace(",", "."));
    if (
      !form.latitud.trim() ||
      !form.longitud.trim() ||
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud) ||
      Math.abs(latitud) > 90 ||
      Math.abs(longitud) > 180
    )
      throw new Error("Revisá la latitud y longitud del local.");
    if (form.whatsapp && !/^\d+$/.test(form.whatsapp))
      throw new Error(
        "WhatsApp lleva solo números con código de país, por ejemplo 5493442421000.",
      );
    if (form.instagram && !form.instagram.startsWith("@"))
      throw new Error("El usuario de Instagram debe empezar con @.");
    if (horariosModificados) validarHorarios(horarios);
    if (form.cerradoHasta) fechaHoraISO(form.cerradoHasta, "23:59");
    await comerciosService.actualizarComercio({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      direccion: form.direccion.trim(),
      coordenadas: { latitud, longitud },
      telefono: form.telefono.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      instagram: form.instagram.trim() || null,
      mediosDePago,
      ...(horariosModificados ? { horarios } : {}),
      ...(form.cerradoHasta !== (comercio!.cerradoHasta ?? "")
        ? { cerradoHasta: form.cerradoHasta || null }
        : {}),
    });
    setEditando(false);
    await cargar();
    Alert.alert("Cambios guardados", "La ficha ya está actualizada.");
  }
  async function elegirArchivo(
    video: boolean,
    camara = false,
    paraPromo = false,
  ) {
    const permiso = camara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted)
      throw new Error(
        `Permití el acceso a la ${camara ? "cámara" : "galería"} para continuar.`,
      );
    const opciones: ImagePicker.ImagePickerOptions = {
      mediaTypes: video ? ["videos"] : ["images"],
      quality: 0.8,
      videoMaxDuration: 30,
    };
    const result = await (
      camara
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync
    )(opciones);
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (video && (!asset.duration || asset.duration > 30_000))
      throw new Error("Elegí un video de hasta treinta segundos.");
    if ((asset.fileSize ?? 0) > (video ? 30 : 5) * 1024 * 1024)
      throw new Error(
        video
          ? "El video puede pesar hasta 30 MB."
          : "La foto puede pesar hasta 5 MB.",
      );
    if (video && asset.mimeType && asset.mimeType !== "video/mp4")
      throw new Error(
        "La API admite videos MP4. Elegí un archivo en ese formato.",
      );
    const nombre = `${video ? "video" : "foto"}_${Date.now()}.${video ? "mp4" : "jpg"}`;
    const local = await guardarFotoEnAlmacenamiento(asset.uri, nombre);
    const subido = await archivosService.subir(
      local,
      nombre,
      asset.mimeType ?? (video ? "video/mp4" : "image/jpeg"),
    );
    if (paraPromo) {
      setPromo((p) => ({ ...p, imagenUrl: subido.url }));
      return;
    }
    await comerciosService.actualizarComercio(
      video
        ? { videoUrl: subido.url }
        : { imagenes: [...comercio!.imagenes, subido.url] },
    );
    await cargar();
  }
  function abrirPromo(p?: Promocion) {
    const desde = p ? new Date(p.desde) : new Date();
    const hasta = p ? new Date(p.hasta) : new Date(Date.now() + 30 * 86400000);
    setPromoId(p?.id ?? null);
    setPromo({
      titulo: p?.titulo ?? "",
      detalle: p?.detalle ?? "",
      descuento: p?.descuento?.toString() ?? "",
      fechaDesde: fechaLocal(desde),
      horaDesde: horaLocal(desde),
      fechaHasta: fechaLocal(hasta),
      horaHasta: p ? horaLocal(hasta) : "23:59",
      soloApp: p?.soloApp ?? true,
      imagenUrl: p?.imagenUrl ?? null,
    });
    setModalPromo(true);
  }
  async function guardarPromo() {
    if (!promo.titulo.trim() || !promo.detalle.trim())
      throw new Error("Completá el título y las condiciones de la promoción.");
    if (promo.titulo.trim().length > 120 || promo.detalle.trim().length > 2000)
      throw new Error(
        "El título admite 120 caracteres y las condiciones 2000.",
      );
    const descuento = promo.descuento.trim() ? Number(promo.descuento) : null;
    if (
      descuento !== null &&
      (!Number.isInteger(descuento) || descuento < 1 || descuento > 100)
    )
      throw new Error("El descuento debe ser un porcentaje entero de 1 a 100.");
    const desde = fechaHoraISO(promo.fechaDesde, promo.horaDesde),
      hasta = fechaHoraISO(promo.fechaHasta, promo.horaHasta);
    if (
      Date.parse(hasta) <= Date.parse(desde) ||
      Date.parse(hasta) <= Date.now()
    )
      throw new Error(
        "El vencimiento debe ser posterior al inicio y al momento actual.",
      );
    const datos = {
      titulo: promo.titulo.trim(),
      detalle: promo.detalle.trim(),
      descuento,
      desde,
      hasta,
      soloApp: promo.soloApp,
      imagenUrl: promo.imagenUrl,
    };
    if (promoId) await comerciosService.editarPromocion(promoId, datos);
    else await comerciosService.crearPromocion(datos);
    setModalPromo(false);
    await cargar();
  }
  const card = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];
  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        )}
        <Button
          title="Escanear cupón del cliente"
          icon="scan"
          onPress={() => router.push("/validar-cupon")}
        />
        <View style={card}>
          <ThemedText type="subtitle">Datos del comercio</ThemedText>
          <Button
            title={editando ? "Cancelar edición" : "Editar ficha y horarios"}
            variant="secondary"
            disabled={ocupado}
            onPress={() => {
              setEditando(!editando);
              if (editando) cargar();
            }}
          />
          {editando ? (
            <View style={styles.gap}>
              <TextField
                label="Nombre del local"
                value={form.nombre}
                onChangeText={(v) => campo("nombre", v)}
              />
              <TextField
                label="Descripción"
                value={form.descripcion}
                multiline
                onChangeText={(v) => campo("descripcion", v)}
              />
              <TextField
                label="Dirección"
                value={form.direccion}
                onChangeText={(v) => campo("direccion", v)}
              />
              <TextField
                label="Teléfono"
                value={form.telefono}
                keyboardType="phone-pad"
                onChangeText={(v) => campo("telefono", v)}
              />
              <TextField
                label="WhatsApp (con código de país)"
                placeholder="5493442421000"
                value={form.whatsapp}
                keyboardType="phone-pad"
                onChangeText={(v) => campo("whatsapp", v)}
              />
              <TextField
                label="Instagram"
                placeholder="@tucomercio"
                value={form.instagram}
                autoCapitalize="none"
                onChangeText={(v) => campo("instagram", v)}
              />
              <TextField
                label="Latitud"
                value={form.latitud}
                keyboardType="numbers-and-punctuation"
                onChangeText={(v) => campo("latitud", v)}
              />
              <TextField
                label="Longitud"
                value={form.longitud}
                keyboardType="numbers-and-punctuation"
                onChangeText={(v) => campo("longitud", v)}
              />
              <ThemedText type="defaultSemiBold">Medios de pago</ThemedText>
              {Object.entries(pagos).map(([clave, label]) => (
                <View style={styles.row} key={clave}>
                  <ThemedText style={styles.flex}>{label}</ThemedText>
                  <Switch
                    value={mediosDePago.includes(clave)}
                    onValueChange={(on) =>
                      setMediosDePago(
                        on
                          ? [...mediosDePago, clave]
                          : mediosDePago.filter((m) => m !== clave),
                      )
                    }
                  />
                </View>
              ))}
              <ThemedText type="subtitle">Horarios de atención</ThemedText>
              <EditorHorarios
                horarios={horarios}
                onChange={(h) => {
                  setHorarios(h);
                  setHorariosModificados(true);
                }}
              />
              <TextField
                label="Cerrado por vacaciones hasta (AAAA-MM-DD)"
                placeholder="Dejar vacío si no hay cierre"
                value={form.cerradoHasta}
                onChangeText={(v) => campo("cerradoHasta", v)}
              />
              <Button
                title="Levantar cierre por vacaciones"
                variant="secondary"
                disabled={ocupado}
                onPress={() =>
                  ejecutar(async () => {
                    await comerciosService.actualizarComercio({
                      cerradoHasta: null,
                    });
                    setEditando(false);
                    await cargar();
                  })
                }
              />
              <Button
                title="Guardar ficha"
                loading={ocupado}
                onPress={() => ejecutar(guardarDatos)}
              />
            </View>
          ) : (
            <>
              <ThemedText type="defaultSemiBold">{comercio.nombre}</ThemedText>
              <ThemedText>{comercio.direccion}</ThemedText>
              <ThemedText>{comercio.descripcion}</ThemedText>
            </>
          )}
        </View>
        <View style={card}>
          <ThemedText type="subtitle">Fotos y video</ThemedText>
          {comercio.imagenes.map((img, i) => (
            <View key={img} style={styles.gap}>
              <Image source={img} style={styles.image} contentFit="cover" />
              <Button
                title={`Quitar foto ${i + 1}`}
                variant="secondary"
                disabled={ocupado}
                onPress={() =>
                  Alert.alert(
                    "Quitar foto",
                    "¿Querés quitar esta foto de la ficha?",
                    [
                      { text: "Cancelar" },
                      {
                        text: "Quitar",
                        style: "destructive",
                        onPress: () =>
                          ejecutar(async () => {
                            await comerciosService.actualizarComercio({
                              imagenes: comercio.imagenes.filter(
                                (_, j) => i !== j,
                              ),
                            });
                            await cargar();
                          }),
                      },
                    ],
                  )
                }
              />
            </View>
          ))}
          <Button
            title="Agregar foto de la galería"
            icon="image-outline"
            variant="secondary"
            disabled={ocupado || comercio.imagenes.length >= 8}
            onPress={() => ejecutar(() => elegirArchivo(false))}
          />
          <ThemedText>
            Hasta ocho fotos y un video de treinta segundos, en MP4.
          </ThemedText>
          {comercio.videoUrl && (
            <>
              <ComercioVideo videoUrl={comercio.videoUrl} />
              <Button
                title="Quitar video"
                variant="secondary"
                disabled={ocupado}
                onPress={() =>
                  ejecutar(async () => {
                    await comerciosService.actualizarComercio({
                      videoUrl: null,
                    });
                    await cargar();
                  })
                }
              />
            </>
          )}
          <Button
            title="Elegir video MP4"
            icon="videocam-outline"
            variant="secondary"
            loading={ocupado}
            onPress={() => ejecutar(() => elegirArchivo(true))}
          />
          <Button
            title="Grabar video de presentación"
            variant="secondary"
            disabled={ocupado}
            onPress={() => ejecutar(() => elegirArchivo(true, true))}
          />
        </View>
        <View style={card}>
          <ThemedText type="subtitle">Mis promociones y canjes</ThemedText>
          <Button
            title="Nueva promoción"
            icon="add"
            disabled={ocupado}
            onPress={() => abrirPromo()}
          />
          {promos.length === 0 && (
            <ThemedText>Todavía no cargaste promociones.</ThemedText>
          )}
          {promos.map((p) => (
            <View
              key={p.id}
              style={[styles.item, { borderColor: colors.border }]}
            >
              <ThemedText type="defaultSemiBold">{p.titulo}</ThemedText>
              <ThemedText>
                {estadoPromocion(p, ahora)} · {p.usos} canjes
              </ThemedText>
              <ThemedText>{p.detalle}</ThemedText>
              <ThemedText>
                Desde {new Date(p.desde).toLocaleString("es-AR")} hasta{" "}
                {new Date(p.hasta).toLocaleString("es-AR")}
              </ThemedText>
              {p.activa && (
                <>
                  <Button
                    title="Editar promoción"
                    variant="secondary"
                    disabled={ocupado}
                    onPress={() => abrirPromo(p)}
                  />
                  <Button
                    title="Dar de baja"
                    variant="danger"
                    disabled={ocupado}
                    onPress={() =>
                      Alert.alert(
                        "Dar de baja",
                        "La promoción dejará de estar disponible.",
                        [
                          { text: "Cancelar" },
                          {
                            text: "Dar de baja",
                            style: "destructive",
                            onPress: () =>
                              ejecutar(async () => {
                                await comerciosService.darDeBajaPromocion(p.id);
                                await cargar();
                              }),
                          },
                        ],
                      )
                    }
                  />
                </>
              )}
            </View>
          ))}
        </View>
        <View style={card}>
          <ThemedText type="subtitle">Reseñas de clientes</ThemedText>
          {resenas.length === 0 && (
            <ThemedText>Todavía no hay reseñas.</ThemedText>
          )}
          {resenas.map((r) => (
            <View
              key={r.id}
              style={[styles.item, { borderColor: colors.border }]}
            >
              <ThemedText type="defaultSemiBold">
                {r.usuarioNombre ?? "Vecino"} · {r.estrellas} estrellas
              </ThemedText>
              <ThemedText>{r.comentario}</ThemedText>
              <ThemedText>
                {new Date(r.creadaEn).toLocaleDateString("es-AR")}
              </ThemedText>
              {r.respuesta ? (
                <ThemedText>Tu respuesta: {r.respuesta}</ThemedText>
              ) : (
                <Button
                  title="Responder una vez"
                  variant="secondary"
                  onPress={() => {
                    setResponder(r);
                    setRespuesta("");
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={modalPromo}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!ocupado) setModalPromo(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={[styles.modal, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.gap}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="subtitle">
              {promoId ? "Editar promoción" : "Nueva promoción"}
            </ThemedText>
            <TextField
              label="Título"
              maxLength={120}
              value={promo.titulo}
              onChangeText={(titulo) => setPromo({ ...promo, titulo })}
            />
            <TextField
              label="Condiciones"
              maxLength={2000}
              multiline
              value={promo.detalle}
              onChangeText={(detalle) => setPromo({ ...promo, detalle })}
            />
            <TextField
              label="Descuento porcentual (opcional)"
              keyboardType="number-pad"
              value={promo.descuento}
              onChangeText={(descuento) => setPromo({ ...promo, descuento })}
            />
            <TextField
              label="Fecha de inicio (AAAA-MM-DD)"
              value={promo.fechaDesde}
              onChangeText={(fechaDesde) => setPromo({ ...promo, fechaDesde })}
            />
            <TextField
              label="Hora de inicio (HH:MM)"
              value={promo.horaDesde}
              onChangeText={(horaDesde) => setPromo({ ...promo, horaDesde })}
            />
            <TextField
              label="Fecha de vencimiento (AAAA-MM-DD)"
              value={promo.fechaHasta}
              onChangeText={(fechaHasta) => setPromo({ ...promo, fechaHasta })}
            />
            <TextField
              label="Hora de vencimiento (HH:MM)"
              value={promo.horaHasta}
              onChangeText={(horaHasta) => setPromo({ ...promo, horaHasta })}
            />
            <View style={styles.row}>
              <ThemedText style={styles.flex}>
                Exclusiva de la app (requiere cupón)
              </ThemedText>
              <Switch
                value={promo.soloApp}
                onValueChange={(soloApp) => setPromo({ ...promo, soloApp })}
              />
            </View>
            {promo.imagenUrl && (
              <>
                <Image source={promo.imagenUrl} style={styles.image} />
                <Button
                  title="Quitar imagen de la promo"
                  variant="secondary"
                  onPress={() => setPromo({ ...promo, imagenUrl: null })}
                />
              </>
            )}
            <Button
              title="Elegir imagen de la promoción"
              variant="secondary"
              disabled={ocupado}
              onPress={() => ejecutar(() => elegirArchivo(false, false, true))}
            />
            <Button
              title="Guardar promoción"
              loading={ocupado}
              onPress={() => ejecutar(guardarPromo)}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={ocupado}
              onPress={() => setModalPromo(false)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={responder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!ocupado) setResponder(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modal,
              styles.gap,
              { backgroundColor: colors.background },
            ]}
          >
            <ThemedText type="subtitle">Responder al cliente</ThemedText>
            <TextField
              label="Tu respuesta"
              maxLength={1000}
              multiline
              value={respuesta}
              onChangeText={setRespuesta}
            />
            <ThemedText>Podés responder una vez a cada reseña.</ThemedText>
            <Button
              title="Enviar respuesta"
              loading={ocupado}
              onPress={() =>
                ejecutar(async () => {
                  if (!respuesta.trim() || !responder)
                    throw new Error("Escribí una respuesta.");
                  await comerciosService.responderResena(
                    responder.id,
                    respuesta.trim(),
                  );
                  setResponder(null);
                  await cargar();
                })
              }
            />
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={ocupado}
              onPress={() => setResponder(null)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 18, paddingBottom: 40 },
  gap: { gap: 12 },
  card: { padding: 16, borderWidth: 1, borderRadius: 12, gap: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  item: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  image: { width: "100%", height: 180, borderRadius: 8 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: { padding: 20, borderRadius: 14, maxHeight: "90%" },
});
