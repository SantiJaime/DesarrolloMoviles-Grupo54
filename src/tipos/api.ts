export interface ApiRespuesta<T> {
  datos: T;
  meta?: {
    total: number;
    pagina: number;
    porPagina: number;
  } | null;
  cache?: { actualizadoEn: string };
}

export interface ApiError {
  error: {
    codigo: string;
    mensaje: string;
  };
}
