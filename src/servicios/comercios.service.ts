import {
  guardarComerciosEnDB,
  guardarRubrosEnDB,
  obtenerComercioPorIdDeDB,
  obtenerComerciosDeDB,
  obtenerRubrosDeDB,
  guardarCache,
  leerCache,
} from "@/src/lib/db";
import { resolverMultimedia } from "@/src/lib/file-cache";
import { estaAbiertoAhora } from "@/src/lib/horarios";
import { checkNetworkStatus } from "@/src/lib/network";
import type {
  ApiRespuesta,
  Comercio,
  Horario,
  Promocion,
  Resena,
  Rubro,
  UsoDePromocion,
} from "@/src/tipos";
import { isAxiosError } from "axios";

import { api } from "@/src/servicios/api/client";

export interface FiltrosComercios {
  query?: string;
  rubroId?: string;
  soloAbiertos?: boolean;
}

export interface CambiosComercio {
  nombre?: string;
  descripcion?: string;
  direccion?: string;
  coordenadas?: Comercio["coordenadas"];
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  imagenes?: string[];
  videoUrl?: string | null;
  horarios?: Horario[];
  mediosDePago?: string[];
  cerradoHasta?: string | null;
}

export type NuevaPromocion = Pick<Promocion, "titulo" | "detalle" | "hasta"> &
  Partial<Pick<Promocion, "descuento" | "desde" | "imagenUrl" | "soloApp">>;

const id = (valor: string) => encodeURIComponent(valor);

const sinTildes = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const esSinConexion = (e: unknown) => isAxiosError(e) && !e.response;

async function conRespaldoLocal<T>(
  remoto: () => Promise<ApiRespuesta<T>>,
  local: () => Promise<ApiRespuesta<T> | null>,
  clave: string,
): Promise<ApiRespuesta<T>> {
  const online = await checkNetworkStatus();
  if (online) {
    try {
      const respuesta = await remoto();
      await guardarCache(clave, respuesta.datos).catch(() => {});
      return respuesta;
    } catch (e) {
      if (
        !esSinConexion(e) &&
        !(isAxiosError(e) && (e.response?.status ?? 0) >= 500)
      )
        throw e;
    }
  }
  const cache = await leerCache<T>(clave);
  if (cache)
    return {
      datos: cache.datos,
      cache: { actualizadoEn: cache.actualizadoEn },
    };
  const guardado = await local();
  if (guardado === null) {
    throw new Error(
      "No hay conexión y todavía no hay datos guardados en el teléfono.",
    );
  }
  return { ...guardado, cache: { actualizadoEn: "" } };
}

async function listar<T>(
  ruta: string,
  params: Record<string, unknown> = {},
): Promise<ApiRespuesta<T[]>> {
  const datos: T[] = [];
  let pagina = 1;
  while (true) {
    const { data } = await api.get<ApiRespuesta<T[]>>(ruta, {
      params: { ...params, pagina, porPagina: 100 },
    });
    datos.push(...data.datos);
    if (
      !data.meta ||
      datos.length >= data.meta.total ||
      data.datos.length === 0
    )
      break;
    pagina += 1;
  }
  return {
    datos,
    meta: { total: datos.length, pagina: 1, porPagina: datos.length },
  };
}

function filtrarComercios(
  lista: Comercio[],
  filtros?: FiltrosComercios,
): Comercio[] {
  let resultado = lista;
  if (filtros?.rubroId) {
    resultado = resultado.filter((c) => c.rubroId === filtros.rubroId);
  }
  if (filtros?.query) {
    const q = sinTildes(filtros.query);
    resultado = resultado.filter(
      (c) =>
        sinTildes(c.nombre).includes(q) || sinTildes(c.descripcion).includes(q),
    );
  }
  return resultado;
}

export const comerciosService = {
  obtenerRubros(): Promise<ApiRespuesta<Rubro[]>> {
    return conRespaldoLocal(
      async () => {
        const { data } = await api.get<ApiRespuesta<Rubro[]>>("/rubros");
        guardarRubrosEnDB(data.datos).catch(() => {});
        return data;
      },
      async () => {
        const rubros = await obtenerRubrosDeDB();
        return rubros.length > 0 ? { datos: rubros } : null;
      },
      "rubros",
    );
  },

  async obtenerComercios(
    filtros?: FiltrosComercios,
  ): Promise<ApiRespuesta<Comercio[]>> {
    const res = await conRespaldoLocal(
      async () => {
        const data = await listar<Comercio>("/comercios", {
          q: filtros?.query?.trim() || undefined,
          rubroId: filtros?.rubroId,
        });
        guardarComerciosEnDB(data.datos).catch(() => {});
        return data;
      },
      async () => {
        const comercios = await obtenerComerciosDeDB();
        return comercios.length > 0
          ? { datos: filtrarComercios(comercios, filtros) }
          : null;
      },
      `comercios:${JSON.stringify({ query: filtros?.query, rubroId: filtros?.rubroId })}`,
    );

    res.datos = await Promise.all(res.datos.map(resolverMultimedia));

    if (!filtros?.soloAbiertos) return res;
    const abiertos = res.datos.filter((c) =>
      estaAbiertoAhora(c.horarios, c.activo),
    );
    return {
      ...res,
      datos: abiertos,
      meta: { total: abiertos.length, pagina: 1, porPagina: abiertos.length },
    };
  },

  async obtenerComercioPorId(
    comercioId: string,
  ): Promise<ApiRespuesta<Comercio>> {
    const res = await conRespaldoLocal(
      async () => {
        const { data } = await api.get<ApiRespuesta<Comercio>>(
          `/comercios/${id(comercioId)}`,
        );
        guardarComerciosEnDB([data.datos]).catch(() => {});
        return data;
      },
      async () => {
        const comercio = await obtenerComercioPorIdDeDB(comercioId);
        return comercio ? { datos: comercio } : null;
      },
      `comercio:${comercioId}`,
    );
    return { ...res, datos: await resolverMultimedia(res.datos) };
  },

  async obtenerPromociones(filtros?: {
    rubroId?: string;
    comercioId?: string;
    estado?: "vigentes" | "proximas" | "por-vencer";
  }): Promise<ApiRespuesta<Promocion[]>> {
    if (!(await checkNetworkStatus()))
      throw new Error("Las promociones necesitan conexión a internet.");
    const estados = filtros?.estado
      ? [filtros.estado]
      : ["vigentes", "proximas"];
    const respuestas = await Promise.all(
      estados.map((estado) =>
        listar<Promocion>("/promociones", {
          rubroId: filtros?.rubroId,
          comercioId: filtros?.comercioId,
          estado,
        }),
      ),
    );
    const datos = [
      ...new Map(
        respuestas.flatMap((r) => r.datos).map((p) => [p.id, p]),
      ).values(),
    ];
    return { datos };
  },

  async obtenerResenas(comercioId: string): Promise<ApiRespuesta<Resena[]>> {
    if (!(await checkNetworkStatus()))
      throw new Error("Las reseñas publicadas necesitan conexión a internet.");
    const res = await listar<Resena>(`/comercios/${id(comercioId)}/resenas`);
    return {
      ...res,
      datos: res.datos.sort(
        (a, b) => Date.parse(b.creadaEn) - Date.parse(a.creadaEn),
      ),
    };
  },

  async crearResena(
    comercioId: string,
    datos: Pick<Resena, "estrellas" | "comentario">,
  ): Promise<ApiRespuesta<Resena>> {
    const { data } = await api.post<ApiRespuesta<Resena>>(
      `/comercios/${id(comercioId)}/resenas`,
      {
        estrellas: datos.estrellas,
        comentario: datos.comentario,
      },
    );
    return data;
  },

  async editarResena(
    resenaId: string,
    cambios: Pick<Resena, "estrellas" | "comentario">,
  ): Promise<ApiRespuesta<Resena>> {
    const { data } = await api.patch<ApiRespuesta<Resena>>(
      `/resenas/${id(resenaId)}`,
      cambios,
    );
    return data;
  },

  async eliminarResena(resenaId: string): Promise<void> {
    await api.delete(`/resenas/${id(resenaId)}`);
  },

  async reportarResena(resenaId: string): Promise<void> {
    await api.post(`/resenas/${id(resenaId)}/reportes`);
  },

  async responderResena(resenaId: string, respuesta: string): Promise<void> {
    await api.post(`/resenas/${id(resenaId)}/respuesta`, { respuesta });
  },

  async generarCodigoUso(promocionId: string): Promise<UsoDePromocion> {
    const { data } = await api.post<ApiRespuesta<UsoDePromocion>>(
      `/promociones/${id(promocionId)}/usos`,
    );
    return data.datos;
  },

  async obtenerMisUsos(): Promise<ApiRespuesta<UsoDePromocion[]>> {
    return listar<UsoDePromocion>("/yo/usos");
  },

  async validarCodigoPromocion(codigo: string): Promise<UsoDePromocion> {
    const { data } = await api.post<ApiRespuesta<UsoDePromocion>>(
      "/mi-comercio/usos/validar",
      { codigo },
    );
    return data.datos;
  },

  async actualizarComercio(cambios: CambiosComercio): Promise<Comercio> {
    const { data } = await api.patch<ApiRespuesta<Comercio>>(
      "/mi-comercio",
      cambios,
    );
    guardarComerciosEnDB([data.datos]).catch(() => {});
    return data.datos;
  },

  async crearPromocion(datos: NuevaPromocion): Promise<Promocion> {
    const { data } = await api.post<ApiRespuesta<Promocion>>(
      "/mi-comercio/promociones",
      datos,
    );
    return data.datos;
  },

  async obtenerMiComercio(): Promise<Comercio> {
    const { data } = await api.get<ApiRespuesta<Comercio>>("/mi-comercio");
    return data.datos;
  },

  obtenerMisPromociones(): Promise<ApiRespuesta<Promocion[]>> {
    return listar<Promocion>("/mi-comercio/promociones");
  },

  async editarPromocion(
    promoId: string,
    cambios: Partial<NuevaPromocion>,
  ): Promise<Promocion> {
    const { data } = await api.patch<ApiRespuesta<Promocion>>(
      `/mi-comercio/promociones/${id(promoId)}`,
      cambios,
    );
    return data.datos;
  },

  async darDeBajaPromocion(promoId: string): Promise<void> {
    await api.delete(`/mi-comercio/promociones/${id(promoId)}`);
  },
};
