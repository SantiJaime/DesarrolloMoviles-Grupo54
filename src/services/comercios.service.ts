import type { Comercio } from "@/src/types/models";

import { mockRequest } from "./api/client";
import { COMERCIOS, PROMOCIONES, RUBROS } from "./mock/data";

const withRubro = (c: Comercio): Comercio => ({
  ...c,
  rubro: RUBROS.find((r) => r.id === c.rubroId),
});

export const comerciosService = {
  list: () => mockRequest(() => COMERCIOS.map(withRubro)),

  getById: (id: string) =>
    mockRequest(() => {
      const comercio = COMERCIOS.find((c) => c.id === id);
      if (!comercio) throw new Error("No encontramos el comercio.");
      return withRubro(comercio);
    }),

  getPromociones: (id: string) =>
    mockRequest(() => PROMOCIONES.filter((p) => p.comercioId === id && p.activa)),
};
