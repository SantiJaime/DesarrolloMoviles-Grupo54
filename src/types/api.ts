export interface ApiRespuesta<T> {
  datos: T;
  meta?: {
    total: number;
    pagina: number;
    porPagina: number;
  };
}

export interface ApiError {
  error: {
    codigo: string;
    mensaje: string;
  };
}
