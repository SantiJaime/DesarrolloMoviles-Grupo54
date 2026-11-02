import type { ApiRespuesta } from "@/src/tipos";
import { api } from "@/src/servicios/api/client";

export interface ArchivoSubido {
  url: string;
  tipo: "imagen" | "audio" | "video";
  bytes: number;
}

export const archivosService = {
  async subir(
    uri: string,
    nombre: string,
    mimeType = "image/jpeg",
  ): Promise<ArchivoSubido> {
    const form = new FormData();
    form.append("archivo", {
      uri,
      name: nombre,
      type: mimeType,
    } as unknown as Blob);
    const { data } = await api.post<ApiRespuesta<ArchivoSubido>>(
      "/archivos",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: (body) => body,
        timeout: 120_000,
      },
    );
    return data.datos;
  },
};
