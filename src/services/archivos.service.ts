import type { ApiRespuesta } from "@/src/types";
import { api } from "@/src/services/api/client";

export interface ArchivoSubido {
  url: string;
  tipo: "imagen" | "audio" | "video";
  bytes: number;
}

export const archivosService = {
  async subir(uri: string, nombre: string, mimeType = "image/jpeg"): Promise<ArchivoSubido> {
    const form = new FormData();
    form.append("archivo", { uri, name: nombre, type: mimeType } as unknown as Blob);
    const { data } = await api.post<ApiRespuesta<ArchivoSubido>>("/archivos", form, {
      headers: { "Content-Type": "multipart/form-data" },
      transformRequest: (body) => body,
    });
    return data.datos;
  },
};
