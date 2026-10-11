export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Horario {
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  abre: string;
  cierra: string;
}

export interface Comercio {
  id: string;
  nombre: string;
  rubroId: string;
  descripcion: string;
  direccion: string;
  coordenadas: Coordenadas;
  telefono: string | null;
  whatsapp: string | null;
  instagram: string | null;
  imagenes: string[];
  videoUrl: string | null;
  horarios: Horario[];
  mediosDePago: string[];
  puntaje: number;
  cantidadResenas: number;
  codigoQr: string | null;
  activo: boolean;
}

export interface Rubro {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  orden: number;
}

export interface Promocion {
  id: string;
  comercioId: string;
  titulo: string;
  detalle: string;
  descuento: number | null;
  desde: string;
  hasta: string;
  imagenUrl: string | null;
  soloApp: boolean;
  usos: number;
  activa: boolean;
}

export interface Resena {
  id: string;
  comercioId: string;
  usuarioId: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario: string;
  respuesta: string | null;
  reportada: boolean;
  creadaEn: string;
  sincronizada: boolean;
  fotoUrl?: string | null;
  usuarioNombre?: string;
}

export interface UsoDePromocion {
  id: string;
  promocionId: string;
  usuarioId: string;
  codigo: string;
  validadoEn: string | null;
}

export type Rol = "vecino" | "comercio";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  comercioId: string | null;
  favoritos: string[];
  rubrosDeInteres: string[];
  avisosActivos: boolean;
  biometriaHabilitada?: boolean;
}

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
