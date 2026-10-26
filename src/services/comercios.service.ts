import {
  guardarComerciosEnDB,
  guardarRubrosEnDB,
  obtenerComercioPorIdDeDB,
  obtenerComerciosDeDB,
  obtenerRubrosDeDB,
} from "@/src/lib/db";
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
} from "@/src/types";
import { isAxiosError } from "axios";

import { api } from "@/src/services/api/client";

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
  remoto: () => Promise<T>,
  local: () => Promise<T | null>,
): Promise<T> {
  const online = await checkNetworkStatus();
  if (online) {
    try {
      return await remoto();
    } catch (e) {
      if (!esSinConexion(e)) throw e;
    }
  }
  const guardado = await local();
  if (guardado === null) {
    throw new Error("No hay conexión y todavía no hay datos guardados en el teléfono.");
  }
  return guardado;
}

function filtrarComercios(lista: Comercio[], filtros?: FiltrosComercios): Comercio[] {
  let resultado = lista;
  if (filtros?.rubroId) {
    resultado = resultado.filter((c) => c.rubroId === filtros.rubroId);
  }
  if (filtros?.query) {
    const q = sinTildes(filtros.query);
    resultado = resultado.filter(
      (c) => sinTildes(c.nombre).includes(q) || sinTildes(c.descripcion).includes(q)
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
      }
    );
  },

  async obtenerComercios(filtros?: FiltrosComercios): Promise<ApiRespuesta<Comercio[]>> {
    const res = await conRespaldoLocal(
      async () => {
        const { data } = await api.get<ApiRespuesta<Comercio[]>>("/comercios", {
          params: {
            q: filtros?.query?.trim() || undefined,
            rubroId: filtros?.rubroId,
            porPagina: 1000,
          },
        });
        guardarComerciosEnDB(data.datos).catch(() => {});
        return data;
      },
      async () => {
        const comercios = await obtenerComerciosDeDB();
        return comercios.length > 0 ? { datos: filtrarComercios(comercios, filtros) } : null;
      }
    );

    if (!filtros?.soloAbiertos) return res;
    const abiertos = res.datos.filter((c) => estaAbiertoAhora(c.horarios, c.activo));
    return { datos: abiertos, meta: { total: abiertos.length, pagina: 1, porPagina: abiertos.length } };
  },

  obtenerComercioPorId(comercioId: string): Promise<ApiRespuesta<Comercio>> {
    return conRespaldoLocal(
      async () => {
        const { data } = await api.get<ApiRespuesta<Comercio>>(`/comercios/${id(comercioId)}`);
        guardarComerciosEnDB([data.datos]).catch(() => {});
        return data;
      },
      async () => {
        const comercio = await obtenerComercioPorIdDeDB(comercioId);
        return comercio ? { datos: comercio } : null;
      }
    );
  },

  async obtenerPromociones(filtros?: {
    rubroId?: string;
    comercioId?: string;
  }): Promise<ApiRespuesta<Promocion[]>> {
    const { data } = await api.get<ApiRespuesta<Promocion[]>>("/promociones", {
      params: {
        rubroId: filtros?.rubroId,
        comercioId: filtros?.comercioId,
        porPagina: 100,
      },
    });
    return data;
  },

  async obtenerResenas(comercioId: string): Promise<ApiRespuesta<Resena[]>> {
    const { data } = await api.get<ApiRespuesta<Resena[]>>(`/comercios/${id(comercioId)}/resenas`, {
      params: { porPagina: 100 },
    });
    return data;
  },

  async crearResena(
    comercioId: string,
    datos: Pick<Resena, "estrellas" | "comentario">
  ): Promise<ApiRespuesta<Resena>> {
    const { data } = await api.post<ApiRespuesta<Resena>>(`/comercios/${id(comercioId)}/resenas`, {
      estrellas: datos.estrellas,
      comentario: datos.comentario,
    });
    return data;
  },
  
  async editarResena(
    resenaId: string,
    cambios: Pick<Resena, "estrellas" | "comentario">
  ): Promise<ApiRespuesta<Resena>> {
    const { data } = await api.patch<ApiRespuesta<Resena>>(`/resenas/${id(resenaId)}`, cambios);
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
    const { data } = await api.post<ApiRespuesta<UsoDePromocion>>(`/promociones/${id(promocionId)}/usos`);
    return data.datos;
  },

  async validarCodigoPromocion(codigo: string): Promise<UsoDePromocion> {
    const { data } = await api.post<ApiRespuesta<UsoDePromocion>>("/mi-comercio/usos/validar", { codigo });
    return data.datos;
  },

  async actualizarComercio(cambios: CambiosComercio): Promise<Comercio> {
    const { data } = await api.patch<ApiRespuesta<Comercio>>("/mi-comercio", cambios);
    guardarComerciosEnDB([data.datos]).catch(() => {});
    return data.datos;
  },

  async crearPromocion(datos: NuevaPromocion): Promise<Promocion> {
    const { data } = await api.post<ApiRespuesta<Promocion>>("/mi-comercio/promociones", datos);
    return data.datos;
  },

  async darDeBajaPromocion(promoId: string): Promise<void> {
    await api.delete(`/mi-comercio/promociones/${id(promoId)}`);
  },
};
