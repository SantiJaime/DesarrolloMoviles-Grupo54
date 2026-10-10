export interface Rubro {
  id: string;
  nombre: string;
  icono: string;
  descripcion?: string;
}

export interface Comercio {
  id: string;
  nombre: string;
  rubroId: string;
  rubro?: Rubro;
  descripcion: string;
  direccion: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
  telefono: string;
  horario: string;
  imagenUrl: string;
  videoUrl?: string;
  valoracionPromedio: number;
  totalResenas: number;
  esFavorito?: boolean;
}

export interface Promocion {
  id: string;
  comercioId: string;
  titulo: string;
  descripcion: string;
  descuentoPorcentaje?: number;
  codigoQR: string;
  fechaValidezHasta: string;
  activa: boolean;
}

export interface Resena {
  id: string;
  comercioId: string;
  usuarioId: string;
  usuarioNombre: string;
  calificacion: number;
  comentario: string;
  fotoUrl?: string;
  fecha: string;
}

export interface UsoDePromocion {
  id: string;
  promocionId: string;
  usuarioId: string;
  fechaCanje: string;
  estado: 'PENDIENTE' | 'CANJEADO' | 'EXPIRADO';
}

export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  token?: string;
  biometriaHabilitada: boolean;
}
