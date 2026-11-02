import { isAxiosError } from "axios";
import {
  borrarResenaLocal,
  guardarResenaLocal,
  obtenerResenasLocales,
} from "@/src/lib/db";
import { checkNetworkStatus } from "@/src/lib/network";
import { getStoredSession } from "@/src/lib/secure-session";
import { api } from "@/src/servicios/api/client";
import type { ApiRespuesta, Resena } from "@/src/tipos";

let sincronizacion: Promise<void> | null = null;
const idNuevo = () =>
  `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const resenasPendientesService = {
  async crear(
    comercioId: string,
    datos: Pick<Resena, "estrellas" | "comentario">,
    fotoUrl?: string | null,
  ): Promise<Resena> {
    const sesion = await getStoredSession();
    if (!datos.comentario.trim() || datos.comentario.trim().length > 1000)
      throw new Error("La reseña debe tener entre 1 y 1000 caracteres.");
    if (!sesion || sesion.usuario.rol !== "vecino")
      throw new Error("Ingresá con una cuenta de vecino para opinar.");
    const locales = await obtenerResenasLocales(sesion.usuario.id, comercioId);
    if (locales.some((r) => !r.sincronizada && !r.pendienteBorrado))
      throw new Error(
        "Ya tenés una reseña pendiente para este comercio. Podés editarla.",
      );
    const resena: Resena = {
      id: idNuevo(),
      comercioId,
      usuarioId: sesion.usuario.id,
      usuarioNombre: sesion.usuario.nombre,
      ...datos,
      fotoUrl: fotoUrl ?? null,
      respuesta: null,
      reportada: false,
      creadaEn: new Date().toISOString(),
      sincronizada: false,
    };
    await guardarResenaLocal(resena);
    await this.sincronizar();
    return (
      (await obtenerResenasLocales(sesion.usuario.id, comercioId)).find(
        (r) => r.id === resena.id,
      ) ?? resena
    );
  },
  async sincronizar(): Promise<void> {
    if (sincronizacion) return sincronizacion;
    sincronizacion = (async () => {
      const sesion = await getStoredSession();
      if (
        !sesion ||
        sesion.usuario.rol !== "vecino" ||
        !(await checkNetworkStatus())
      )
        return;
      const pendientes = (await obtenerResenasLocales(sesion.usuario.id))
        .filter((r) => !r.sincronizada)
        .sort(
          (a, b) =>
            Number(Boolean(b.pendienteBorrado)) -
            Number(Boolean(a.pendienteBorrado)),
        );
      for (const resena of pendientes) {
        // La API acepta un id del teléfono: el reintento después de un corte no duplica.
        if ((await getStoredSession())?.usuario.id !== sesion.usuario.id) break;
        try {
          const headers = { Authorization: `Bearer ${sesion.token}` };
          if (resena.pendienteBorrado) {
            try {
              await api.delete(`/resenas/${encodeURIComponent(resena.id)}`, {
                headers,
              });
            } catch (e) {
              if (!isAxiosError(e) || e.response?.status !== 404) throw e;
            }
            await borrarResenaLocal(resena.id, sesion.usuario.id);
            continue;
          }
          const { data } = await api.post<ApiRespuesta<Resena>>(
            `/comercios/${encodeURIComponent(resena.comercioId)}/resenas`,
            {
              id: resena.id,
              estrellas: resena.estrellas,
              comentario: resena.comentario,
              creadaEn: resena.creadaEn,
            },
            { headers },
          );
          // Un POST repetido puede devolver la versión anterior si se perdió la respuesta.
          // Aplicamos la edición local antes de dar la sincronización por terminada.
          let publicada = data.datos;
          if (
            publicada.comentario !== resena.comentario ||
            publicada.estrellas !== resena.estrellas
          ) {
            const editada = await api.patch<ApiRespuesta<Resena>>(
              `/resenas/${encodeURIComponent(publicada.id)}`,
              { estrellas: resena.estrellas, comentario: resena.comentario },
              { headers },
            );
            publicada = editada.data.datos;
          }
          await guardarResenaLocal({
            ...publicada,
            fotoUrl: resena.fotoUrl,
            errorSincronizacion: null,
          });
        } catch (error) {
          if (
            !isAxiosError(error) ||
            !error.response ||
            error.response.status >= 500
          )
            break;
          await guardarResenaLocal({
            ...resena,
            errorSincronizacion: (error as Error).message,
          });
          if ([401, 403].includes(error.response.status)) break;
        }
      }
    })();
    try {
      await sincronizacion;
    } finally {
      sincronizacion = null;
    }
  },
  async editar(
    resena: Resena,
    cambios: Pick<Resena, "estrellas" | "comentario">,
    fotoUrl?: string | null,
  ): Promise<void> {
    if (!cambios.comentario.trim() || cambios.comentario.trim().length > 1000)
      throw new Error("La reseña debe tener entre 1 y 1000 caracteres.");
    if (sincronizacion) await sincronizacion;
    const sesion = await getStoredSession();
    if (!sesion || sesion.usuario.id !== resena.usuarioId)
      throw new Error("No podés editar esta reseña.");
    resena =
      (await obtenerResenasLocales(sesion.usuario.id, resena.comercioId)).find(
        (r) => r.id === resena.id,
      ) ?? resena;
    if (resena.sincronizada) {
      if (!(await checkNetworkStatus()))
        throw new Error("Conectate para editar una reseña ya publicada.");
      const { data } = await api.patch<ApiRespuesta<Resena>>(
        `/resenas/${encodeURIComponent(resena.id)}`,
        cambios,
      );
      await guardarResenaLocal({
        ...data.datos,
        fotoUrl: fotoUrl ?? resena.fotoUrl,
      });
    } else {
      await guardarResenaLocal({
        ...resena,
        ...cambios,
        fotoUrl: fotoUrl ?? resena.fotoUrl,
        errorSincronizacion: null,
      });
      await this.sincronizar();
    }
  },
  async borrar(resena: Resena): Promise<void> {
    if (sincronizacion) await sincronizacion;
    const sesion = await getStoredSession();
    if (!sesion || sesion.usuario.id !== resena.usuarioId)
      throw new Error("No podés borrar esta reseña.");
    resena =
      (await obtenerResenasLocales(sesion.usuario.id, resena.comercioId)).find(
        (r) => r.id === resena.id,
      ) ?? resena;
    if (resena.sincronizada) {
      await api.delete(`/resenas/${encodeURIComponent(resena.id)}`);
      await borrarResenaLocal(resena.id, sesion.usuario.id);
    } else {
      // No sabemos si un POST sin respuesta alcanzó al servidor. Conservamos la baja hasta confirmarla.
      await guardarResenaLocal({
        ...resena,
        pendienteBorrado: true,
        errorSincronizacion: null,
      });
      await this.sincronizar();
    }
  },
  async combinar(
    comercioId: string,
    remotas: Resena[],
    usuarioId: string | null,
  ): Promise<Resena[]> {
    const sesion = await getStoredSession();
    const locales =
      sesion && sesion.usuario.id === usuarioId
        ? await obtenerResenasLocales(sesion.usuario.id, comercioId)
        : [];
    const resultado = new Map(remotas.map((r) => [r.id, r]));
    for (const local of locales) {
      if (local.pendienteBorrado) {
        resultado.delete(local.id);
        continue;
      }
      const remota = resultado.get(local.id);
      if (!local.sincronizada) resultado.set(local.id, local);
      else if (remota)
        resultado.set(local.id, { ...remota, fotoUrl: local.fotoUrl });
    }
    return [...resultado.values()].sort(
      (a, b) => Date.parse(b.creadaEn) - Date.parse(a.creadaEn),
    );
  },
};
