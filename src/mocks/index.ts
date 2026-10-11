import type { Comercio, Promocion, Resena, Rubro, Usuario, UsoDePromocion } from "@/src/tipos";

export const MOCK_RUBROS: Rubro[] = [
  { id: "rub-gastronomia", nombre: "Gastronomía", icono: "restaurant-outline", color: "#E65100", orden: 1 },
  { id: "rub-indumentaria", nombre: "Indumentaria", icono: "shirt-outline", color: "#AD1457", orden: 2 },
  { id: "rub-hogar", nombre: "Hogar", icono: "home-outline", color: "#2E7D32", orden: 3 },
  { id: "rub-ferreteria", nombre: "Ferretería y construcción", icono: "hammer-outline", color: "#7A5C3E", orden: 4 },
  { id: "rub-salud", nombre: "Salud y farmacia", icono: "medkit-outline", color: "#0277BD", orden: 5 },
  { id: "rub-servicios", nombre: "Servicios", icono: "construct-outline", color: "#558B2F", orden: 6 },
  { id: "rub-tecnologia", nombre: "Tecnología", icono: "laptop-outline", color: "#283593", orden: 7 },
  { id: "rub-libreria", nombre: "Librería", icono: "book-outline", color: "#6A1B9A", orden: 8 },
  { id: "rub-vacio", nombre: "Otros", icono: "grid-outline", color: "#616161", orden: 9 },
];

export const MOCK_COMERCIOS: Comercio[] = [
  {
    id: "com-118",
    nombre: "Ferretería El Tornillo",
    rubroId: "rub-ferreteria",
    descripcion: "Ferretería de barrio con más de 40 años sobre 9 de Julio. Herramientas, electricidad, plomería y pinturas.",
    direccion: "9 de Julio 855",
    coordenadas: { latitud: -32.4835, longitud: -58.2312 },
    telefono: "3442-425566",
    whatsapp: "5493442425566",
    instagram: "@eltornillocdelu",
    imagenes: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    horarios: [
      { dia: 1, abre: "08:00", cierra: "12:00" },
      { dia: 1, abre: "16:30", cierra: "20:30" },
      { dia: 2, abre: "08:00", cierra: "12:00" },
      { dia: 2, abre: "16:30", cierra: "20:30" },
      { dia: 3, abre: "08:00", cierra: "12:00" },
      { dia: 3, abre: "16:30", cierra: "20:30" },
      { dia: 4, abre: "08:00", cierra: "12:00" },
      { dia: 4, abre: "16:30", cierra: "20:30" },
      { dia: 5, abre: "08:00", cierra: "12:00" },
      { dia: 5, abre: "16:30", cierra: "20:30" },
      { dia: 6, abre: "08:30", cierra: "13:00" }
    ],
    mediosDePago: ["efectivo", "debito", "transferencia"],
    puntaje: 4.6,
    cantidadResenas: 2,
    codigoQr: "CCU:com-118",
    activo: true
  },
  {
    id: "com-101",
    nombre: "La Casona Restaurante",
    rubroId: "rub-gastronomia",
    descripcion: "Especialidades en pastas caseras, carnes a la parrilla y cocina entrerriana.",
    direccion: "San Martín 450",
    coordenadas: { latitud: -32.4845, longitud: -58.2321 },
    telefono: "3442-420000",
    whatsapp: "5493442420000",
    instagram: "@lacasonacdelu",
    imagenes: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    horarios: [
      { dia: 2, abre: "11:30", cierra: "15:00" },
      { dia: 2, abre: "20:00", cierra: "00:00" },
      { dia: 3, abre: "11:30", cierra: "15:00" },
      { dia: 3, abre: "20:00", cierra: "00:00" },
      { dia: 4, abre: "11:30", cierra: "15:00" },
      { dia: 4, abre: "20:00", cierra: "00:00" },
      { dia: 5, abre: "11:30", cierra: "15:00" },
      { dia: 5, abre: "20:00", cierra: "00:30" },
      { dia: 6, abre: "11:30", cierra: "15:30" },
      { dia: 6, abre: "20:00", cierra: "01:00" },
      { dia: 0, abre: "11:30", cierra: "16:00" }
    ],
    mediosDePago: ["efectivo", "debito", "credito", "transferencia"],
    puntaje: 4.8,
    cantidadResenas: 1,
    codigoQr: "CCU:com-101",
    activo: true
  },
  {
    id: "com-102",
    nombre: "Boutique San Martín",
    rubroId: "rub-indumentaria",
    descripcion: "Moda femenina y masculina con primeras marcas nacionales. Calzados y accesorios.",
    direccion: "San Martín 820",
    coordenadas: { latitud: -32.4831, longitud: -58.2365 },
    telefono: "3442-431111",
    whatsapp: "5493442431111",
    instagram: "@boutiquesanmartin",
    imagenes: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: null,
    horarios: [
      { dia: 1, abre: "09:00", cierra: "12:30" },
      { dia: 1, abre: "17:00", cierra: "20:30" },
      { dia: 2, abre: "09:00", cierra: "12:30" },
      { dia: 2, abre: "17:00", cierra: "20:30" },
      { dia: 3, abre: "09:00", cierra: "12:30" },
      { dia: 3, abre: "17:00", cierra: "20:30" },
      { dia: 4, abre: "09:00", cierra: "12:30" },
      { dia: 4, abre: "17:00", cierra: "20:30" },
      { dia: 5, abre: "09:00", cierra: "12:30" },
      { dia: 5, abre: "17:00", cierra: "20:30" },
      { dia: 6, abre: "09:30", cierra: "13:00" }
    ],
    mediosDePago: ["efectivo", "debito", "credito"],
    puntaje: 4.2,
    cantidadResenas: 1,
    codigoQr: "CCU:com-102",
    activo: true
  },
  {
    id: "com-103",
    nombre: "Farmacia Central",
    rubroId: "rub-salud",
    descripcion: "Atención de obras sociales, perfumería, dermocosmética y recetas médicas.",
    direccion: "Rocamora 702",
    coordenadas: { latitud: -32.4862, longitud: -58.2339 },
    telefono: "3442-422222",
    whatsapp: "5493442422222",
    instagram: "@farmaciacentralcdelu",
    imagenes: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: null,
    horarios: [
      { dia: 1, abre: "08:00", cierra: "22:00" },
      { dia: 2, abre: "08:00", cierra: "22:00" },
      { dia: 3, abre: "08:00", cierra: "22:00" },
      { dia: 4, abre: "08:00", cierra: "22:00" },
      { dia: 5, abre: "08:00", cierra: "22:00" },
      { dia: 6, abre: "08:30", cierra: "21:30" }
    ],
    mediosDePago: ["efectivo", "debito", "credito", "transferencia"],
    puntaje: 4.5,
    cantidadResenas: 1,
    codigoQr: "CCU:com-103",
    activo: true
  },
  {
    id: "com-104",
    nombre: "Heladería Costanera",
    rubroId: "rub-gastronomia",
    descripcion: "Helados artesanales frente al río Uruguay. Café y postres helados.",
    direccion: "Av. Costanera 300",
    coordenadas: { latitud: -32.4878, longitud: -58.2262 },
    telefono: "3442-444444",
    whatsapp: "5493442444444",
    instagram: "@heladeriacostanera",
    imagenes: [
      "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: null,
    horarios: [
      { dia: 1, abre: "14:00", cierra: "01:00" },
      { dia: 2, abre: "14:00", cierra: "01:00" },
      { dia: 3, abre: "14:00", cierra: "01:00" },
      { dia: 4, abre: "14:00", cierra: "01:00" },
      { dia: 5, abre: "14:00", cierra: "02:00" },
      { dia: 6, abre: "12:00", cierra: "02:30" },
      { dia: 0, abre: "12:00", cierra: "01:30" }
    ],
    mediosDePago: ["efectivo", "debito", "transferencia"],
    puntaje: 4.7,
    cantidadResenas: 1,
    codigoQr: "CCU:com-104",
    activo: true
  },
  {
    id: "com-feo-1",
    nombre: "Kiosco El Pasaje",
    rubroId: "rub-servicios",
    descripcion: "Kiosco céntrico, fotocopias y recargas SUBE. Caso feo: sin fotos ni video.",
    direccion: "San Martín 120",
    coordenadas: { latitud: -32.484, longitud: -58.233 },
    telefono: null,
    whatsapp: null,
    instagram: null,
    imagenes: [],
    videoUrl: null,
    horarios: [
      { dia: 1, abre: "08:00", cierra: "21:00" },
      { dia: 2, abre: "08:00", cierra: "21:00" },
      { dia: 3, abre: "08:00", cierra: "21:00" },
      { dia: 4, abre: "08:00", cierra: "21:00" },
      { dia: 5, abre: "08:00", cierra: "21:00" }
    ],
    mediosDePago: ["efectivo"],
    puntaje: 4.0,
    cantidadResenas: 1,
    codigoQr: "CCU:com-feo-1",
    activo: true
  },
  {
    id: "com-feo-2",
    nombre: "Tienda Marisol",
    rubroId: "rub-indumentaria",
    descripcion: "Cerrado por vacaciones hasta el 30 de octubre. Caso feo: cerrado por vacaciones.",
    direccion: "Urquiza 540",
    coordenadas: { latitud: -32.482, longitud: -58.235 },
    telefono: "3442-455555",
    whatsapp: null,
    instagram: "@marisoltienda",
    imagenes: [
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: null,
    horarios: [],
    mediosDePago: ["efectivo", "debito"],
    puntaje: 4.1,
    cantidadResenas: 1,
    codigoQr: "CCU:com-feo-2",
    activo: false
  },
  {
    id: "com-feo-3",
    nombre: "Cerrajería Rápida",
    rubroId: "rub-servicios",
    descripcion: "Urgencias las 24 hs, copias de llaves y mandos. Caso feo: comercio nuevo sin reseñas.",
    direccion: "3 de Febrero 210",
    coordenadas: { latitud: -32.4855, longitud: -58.234 },
    telefono: "3442-466666",
    whatsapp: "5493442466666",
    instagram: null,
    imagenes: [
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80"
    ],
    videoUrl: null,
    horarios: [
      { dia: 1, abre: "08:00", cierra: "19:00" },
      { dia: 2, abre: "08:00", cierra: "19:00" },
      { dia: 3, abre: "08:00", cierra: "19:00" },
      { dia: 4, abre: "08:00", cierra: "19:00" },
      { dia: 5, abre: "08:00", cierra: "19:00" }
    ],
    mediosDePago: ["efectivo", "transferencia"],
    puntaje: 0,
    cantidadResenas: 0,
    codigoQr: "CCU:com-feo-3",
    activo: true
  }
];

export const MOCK_PROMOCIONES: Promocion[] = [
  {
    id: "pro-441",
    comercioId: "com-118",
    titulo: "15% en pinturas",
    detalle: "No acumulable con otras promociones. Válido en pinturas de interior y exterior hasta agotar stock.",
    descuento: 15,
    desde: "2026-09-01T00:00:00-03:00",
    hasta: "2026-12-31T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 27,
    activa: true
  },
  {
    id: "pro-01",
    comercioId: "com-101",
    titulo: "20% OFF pago en efectivo",
    detalle: "Válido de martes a jueves por la noche abonando únicamente en efectivo.",
    descuento: 20,
    desde: "2026-09-01T00:00:00-03:00",
    hasta: "2026-11-30T23:59:00-03:00",
    imagenUrl: null,
    soloApp: false,
    usos: 14,
    activa: true
  },
  {
    id: "pro-02",
    comercioId: "com-101",
    titulo: "Postre de regalo",
    detalle: "Un postre por mesa con consumición mínima de plato principal. ¡Por vencer esta semana!",
    descuento: null,
    desde: "2026-10-01T00:00:00-03:00",
    hasta: "2026-10-15T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 8,
    activa: true
  },
  {
    id: "pro-03",
    comercioId: "com-104",
    titulo: "2x1 en cucuruchos",
    detalle: "Promoción especial de temporada. Arranca en noviembre.",
    descuento: 50,
    desde: "2026-11-01T00:00:00-03:00",
    hasta: "2026-11-30T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 0,
    activa: true
  },
  {
    id: "pro-feo-vencida",
    comercioId: "com-102",
    titulo: "Liquidación de invierno",
    detalle: "Caso feo: promo vencida que no debe mostrarse en la app.",
    descuento: 30,
    desde: "2026-06-01T00:00:00-03:00",
    hasta: "2026-08-31T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 65,
    activa: false
  }
];

export const MOCK_RESENAS: Resena[] = [
  {
    id: "res-2210",
    comercioId: "com-118",
    usuarioId: "usr-512",
    usuarioNombre: "Marta Giménez",
    estrellas: 5,
    comentario: "Tenían el tornillo raro que no conseguía en ningún lado. Excelente atención.",
    respuesta: "¡Gracias Marta! Siempre a las órdenes.",
    reportada: false,
    creadaEn: "2026-09-10T17:05:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2211",
    comercioId: "com-118",
    usuarioId: "usr-demo",
    usuarioNombre: "Carlos Benítez",
    estrellas: 4,
    comentario: "Buen surtido de pinturas y buenos precios. A veces hay demora al mediodía.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-09-22T11:30:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2212",
    comercioId: "com-101",
    usuarioId: "usr-512",
    usuarioNombre: "Marta Giménez",
    estrellas: 5,
    comentario: "Las mejores pastas de Concepción del Uruguay, ambiente súper familiar.",
    respuesta: "¡Muchas gracias Marta por tu visita!",
    reportada: false,
    creadaEn: "2026-09-28T22:15:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2213",
    comercioId: "com-102",
    usuarioId: "usr-demo",
    usuarioNombre: "Carlos Benítez",
    estrellas: 4,
    comentario: "Muy linda ropa y asesoramiento impecable.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-09-15T18:00:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2214",
    comercioId: "com-103",
    usuarioId: "usr-512",
    usuarioNombre: "Marta Giménez",
    estrellas: 5,
    comentario: "Siempre atienden rápido y tienen todos los medicamentos.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-09-18T10:00:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2215",
    comercioId: "com-104",
    usuarioId: "usr-demo",
    usuarioNombre: "Carlos Benítez",
    estrellas: 5,
    comentario: "El sambayón y el dulce de leche granizado son una locura. Linda vista al río.",
    respuesta: "¡Gracias Carlos! Te esperamos pronto.",
    reportada: false,
    creadaEn: "2026-10-02T23:00:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2216",
    comercioId: "com-feo-1",
    usuarioId: "usr-512",
    usuarioNombre: "Marta Giménez",
    estrellas: 4,
    comentario: "Saca de apuros siempre para fotocopias y golosinas.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-08-12T14:00:00-03:00",
    sincronizada: true
  },
  {
    id: "res-2217",
    comercioId: "com-feo-2",
    usuarioId: "usr-demo",
    usuarioNombre: "Carlos Benítez",
    estrellas: 4,
    comentario: "Lástima que cerraron por vacaciones, espero vuelvan pronto.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-09-01T16:00:00-03:00",
    sincronizada: true
  }
];

export const MOCK_USOS: UsoDePromocion[] = [
  {
    id: "uso-7781",
    promocionId: "pro-441",
    usuarioId: "usr-512",
    codigo: "CCU-441-512-8842",
    validadoEn: "2026-09-12T11:20:00-03:00"
  }
];

export const MOCK_USUARIOS: (Usuario & { password: string })[] = [
  {
    id: "usr-512",
    nombre: "Marta Giménez",
    email: "marta@mail.com",
    rol: "vecino",
    comercioId: null,
    favoritos: ["com-118", "com-104"],
    rubrosDeInteres: ["rub-ferreteria", "rub-gastronomia"],
    avisosActivos: true,
    password: "demo1234",
    biometriaHabilitada: false
  },
  {
    id: "usr-comercio",
    nombre: "Roberto Tornillo",
    email: "comercio@mail.com",
    rol: "comercio",
    comercioId: "com-118",
    favoritos: [],
    rubrosDeInteres: ["rub-ferreteria"],
    avisosActivos: true,
    password: "demo1234",
    biometriaHabilitada: false
  }
];
