import type {
  ApiRespuesta,
  Comercio,
  Promocion,
  Resena,
  Rubro,
  UsoDePromocion,
} from "@/src/tipos";
import {
  MOCK_COMERCIOS,
  MOCK_PROMOCIONES,
  MOCK_RESENAS,
  MOCK_RUBROS,
  MOCK_USOS,
} from "@/src/mocks";
import {
  guardarComerciosEnDB,
  obtenerComerciosDeDB,
  obtenerRubrosDeDB,
  guardarRubrosEnDB,
  obtenerComercioPorIdDeDB,
} from "@/src/lib/db";
import { checkNetworkStatus } from "@/src/lib/network";
import { estaAbiertoAhora } from "@/src/lib/horarios";

let comerciosMemoria = [...MOCK_COMERCIOS];
let promocionesMemoria = [...MOCK_PROMOCIONES];
let resenasMemoria = [...MOCK_RESENAS];
let usosMemoria = [...MOCK_USOS];

async function simularLatencia<T>(accion: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return accion();
}

export const comerciosService = {
  async obtenerRubros(): Promise<ApiRespuesta<Rubro[]>> {
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      const rubrosDB = await obtenerRubrosDeDB();
      return {
        datos: rubrosDB.length > 0 ? rubrosDB : MOCK_RUBROS,
        meta: { total: MOCK_RUBROS.length, pagina: 1, porPagina: 20 },
      };
    }
    return simularLatencia(() => {
      guardarRubrosEnDB(MOCK_RUBROS).catch(() => {});
      return {
        datos: MOCK_RUBROS,
        meta: { total: MOCK_RUBROS.length, pagina: 1, porPagina: 20 },
      };
    });
  },

  async obtenerComercios(filtros?: {
    query?: string;
    rubroId?: string;
    soloAbiertos?: boolean;
  }): Promise<ApiRespuesta<Comercio[]>> {
    const isOnline = await checkNetworkStatus();
    let lista: Comercio[] = [];

    if (!isOnline) {
      const deDB = await obtenerComerciosDeDB();
      lista = deDB.length > 0 ? deDB : comerciosMemoria.filter((c) => c.activo);
    } else {
      lista = comerciosMemoria.filter((c) => c.activo);
      guardarComerciosEnDB(lista).catch(() => {});
    }

    if (filtros?.rubroId) {
      lista = lista.filter((c) => c.rubroId === filtros.rubroId);
    }

    if (filtros?.query) {
      const q = filtros.query.toLowerCase().trim();
      lista = lista.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.descripcion.toLowerCase().includes(q)
      );
    }

    if (filtros?.soloAbiertos) {
      lista = lista.filter((c) => estaAbiertoAhora(c.horarios, c.activo));
    }

    return simularLatencia(() => ({
      datos: lista,
      meta: { total: lista.length, pagina: 1, porPagina: 20 },
    }));
  },

  async obtenerComercioPorId(id: string): Promise<ApiRespuesta<Comercio>> {
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      const comDB = await obtenerComercioPorIdDeDB(id);
      if (comDB) return { datos: comDB };
    }

    return simularLatencia(() => {
      const com = comerciosMemoria.find((c) => c.id === id);
      if (!com) {
        throw new Error("El comercio solicitado no existe.");
      }
      return { datos: com };
    });
  },

  async obtenerPromociones(filtros?: {
    rubroId?: string;
    comercioId?: string;
  }): Promise<ApiRespuesta<Promocion[]>> {
    return simularLatencia(() => {
      const ahora = new Date().toISOString();
      let promos = promocionesMemoria.filter(
        (p) => p.activa && p.hasta >= ahora
      );

      if (filtros?.comercioId) {
        promos = promos.filter((p) => p.comercioId === filtros.comercioId);
      }

      if (filtros?.rubroId) {
        const comerciosDelRubro = comerciosMemoria
          .filter((c) => c.rubroId === filtros.rubroId)
          .map((c) => c.id);
        promos = promos.filter((p) =>
          comerciosDelRubro.includes(p.comercioId)
        );
      }

      return {
        datos: promos,
        meta: { total: promos.length, pagina: 1, porPagina: 20 },
      };
    });
  },

  async obtenerResenas(comercioId: string): Promise<ApiRespuesta<Resena[]>> {
    return simularLatencia(() => {
      const resenas = resenasMemoria
        .filter((r) => r.comercioId === comercioId && !r.reportada)
        .sort(
          (a, b) =>
            new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime()
        );
      return {
        datos: resenas,
        meta: { total: resenas.length, pagina: 1, porPagina: 20 },
      };
    });
  },

  async crearResena(
    datos: Omit<Resena, "id" | "creadaEn" | "sincronizada" | "reportada" | "respuesta">
  ): Promise<ApiRespuesta<Resena>> {
    return simularLatencia(() => {
      const nueva: Resena = {
        ...datos,
        id: `res-${Date.now()}`,
        creadaEn: new Date().toISOString(),
        reportada: false,
        respuesta: null,
        sincronizada: true,
      };
      resenasMemoria.unshift(nueva);

      const todasDelComercio = resenasMemoria.filter(
        (r) => r.comercioId === datos.comercioId && !r.reportada
      );
      const suma = todasDelComercio.reduce((acc, r) => acc + r.estrellas, 0);
      const promedio = Number((suma / todasDelComercio.length).toFixed(1));

      const com = comerciosMemoria.find((c) => c.id === datos.comercioId);
      if (com) {
        com.cantidadResenas = todasDelComercio.length;
        com.puntaje = promedio;
      }

      return { datos: nueva };
    });
  },

  async eliminarResena(resenaId: string): Promise<void> {
    return simularLatencia(() => {
      const idx = resenasMemoria.findIndex((r) => r.id === resenaId);
      if (idx !== -1) {
        const comId = resenasMemoria[idx].comercioId;
        resenasMemoria.splice(idx, 1);
        const delCom = resenasMemoria.filter((r) => r.comercioId === comId && !r.reportada);
        const com = comerciosMemoria.find((c) => c.id === comId);
        if (com) {
          com.cantidadResenas = delCom.length;
          com.puntaje = delCom.length > 0 ? Number((delCom.reduce((a, b) => a + b.estrellas, 0) / delCom.length).toFixed(1)) : 0;
        }
      }
    });
  },

  async reportarResena(resenaId: string): Promise<void> {
    return simularLatencia(() => {
      const r = resenasMemoria.find((x) => x.id === resenaId);
      if (r) r.reportada = true;
    });
  },

  async responderResena(resenaId: string, respuesta: string): Promise<void> {
    return simularLatencia(() => {
      const r = resenasMemoria.find((x) => x.id === resenaId);
      if (r) {
        if (r.respuesta) throw new Error("Ya respondiste a esta reseña.");
        r.respuesta = respuesta;
      }
    });
  },

  async generarCodigoUso(promocionId: string, usuarioId: string): Promise<UsoDePromocion> {
    return simularLatencia(() => {
      const codigo = `CCU-${promocionId.replace("pro-", "")}-${usuarioId.replace("usr-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const nuevoUso: UsoDePromocion = {
        id: `uso-${Date.now()}`,
        promocionId,
        usuarioId,
        codigo,
        validadoEn: null,
      };
      usosMemoria.push(nuevoUso);
      return nuevoUso;
    });
  },

  async validarCodigoPromocion(codigo: string): Promise<UsoDePromocion> {
    return simularLatencia(() => {
      const uso = usosMemoria.find((u) => u.codigo === codigo);
      if (!uso) {
        const nuevoUso: UsoDePromocion = {
          id: `uso-${Date.now()}`,
          promocionId: "pro-441",
          usuarioId: "usr-cliente",
          codigo,
          validadoEn: new Date().toISOString(),
        };
        usosMemoria.push(nuevoUso);
        const promo = promocionesMemoria.find((p) => p.id === nuevoUso.promocionId);
        if (promo) promo.usos += 1;
        return nuevoUso;
      }

      if (uso.validadoEn) {
        throw new Error("Este código ya fue validado anteriormente.");
      }

      uso.validadoEn = new Date().toISOString();
      const promo = promocionesMemoria.find((p) => p.id === uso.promocionId);
      if (promo) promo.usos += 1;

      return uso;
    });
  },

  async actualizarComercio(datos: Partial<Comercio> & { id: string }): Promise<Comercio> {
    return simularLatencia(() => {
      const idx = comerciosMemoria.findIndex((c) => c.id === datos.id);
      if (idx === -1) throw new Error("Comercio no encontrado");
      comerciosMemoria[idx] = { ...comerciosMemoria[idx], ...datos };
      guardarComerciosEnDB([comerciosMemoria[idx]]).catch(() => {});
      return comerciosMemoria[idx];
    });
  },

  async crearPromocion(datos: Omit<Promocion, "id" | "usos">): Promise<Promocion> {
    return simularLatencia(() => {
      const nueva: Promocion = {
        ...datos,
        id: `pro-${Date.now()}`,
        usos: 0,
      };
      promocionesMemoria.unshift(nueva);
      return nueva;
    });
  },

  async darDeBajaPromocion(promoId: string): Promise<void> {
    return simularLatencia(() => {
      const p = promocionesMemoria.find((x) => x.id === promoId);
      if (p) p.activa = false;
    });
  },
};
