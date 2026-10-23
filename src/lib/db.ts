import * as SQLite from "expo-sqlite";
import Storage from "expo-sqlite/kv-store";
import type { Comercio, Rubro } from "@/src/types";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("directorio.db");
    await initDatabase(dbInstance);
  }
  return dbInstance;
}

async function initDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS comercios (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      rubroId TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      direccion TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      telefono TEXT,
      whatsapp TEXT,
      instagram TEXT,
      imagenes TEXT NOT NULL,
      videoUrl TEXT,
      horarios TEXT NOT NULL,
      mediosDePago TEXT NOT NULL,
      puntaje REAL NOT NULL,
      cantidadResenas INTEGER NOT NULL,
      codigoQr TEXT,
      activo INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rubros (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      icono TEXT NOT NULL,
      color TEXT NOT NULL,
      orden INTEGER NOT NULL
    );
  `);
}

export async function guardarComerciosEnDB(comercios: Comercio[]): Promise<void> {
  const db = await getDatabase();
  for (const c of comercios) {
    await db.runAsync(
      `INSERT OR REPLACE INTO comercios (
        id, nombre, rubroId, descripcion, direccion, latitud, longitud,
        telefono, whatsapp, instagram, imagenes, videoUrl, horarios,
        mediosDePago, puntaje, cantidadResenas, codigoQr, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.nombre,
        c.rubroId,
        c.descripcion,
        c.direccion,
        c.coordenadas.latitud,
        c.coordenadas.longitud,
        c.telefono,
        c.whatsapp,
        c.instagram,
        JSON.stringify(c.imagenes),
        c.videoUrl,
        JSON.stringify(c.horarios),
        JSON.stringify(c.mediosDePago),
        c.puntaje,
        c.cantidadResenas,
        c.codigoQr,
        c.activo ? 1 : 0,
      ]
    );
  }
}

export async function obtenerComerciosDeDB(): Promise<Comercio[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>("SELECT * FROM comercios WHERE activo = 1 ORDER BY nombre ASC");
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    rubroId: r.rubroId,
    descripcion: r.descripcion,
    direccion: r.direccion,
    coordenadas: {
      latitud: r.latitud,
      longitud: r.longitud,
    },
    telefono: r.telefono,
    whatsapp: r.whatsapp,
    instagram: r.instagram,
    imagenes: JSON.parse(r.imagenes || "[]"),
    videoUrl: r.videoUrl,
    horarios: JSON.parse(r.horarios || "[]"),
    mediosDePago: JSON.parse(r.mediosDePago || "[]"),
    puntaje: r.puntaje,
    cantidadResenas: r.cantidadResenas,
    codigoQr: r.codigoQr,
    activo: r.activo === 1,
  }));
}

export async function obtenerComercioPorIdDeDB(id: string): Promise<Comercio | null> {
  const db = await getDatabase();
  const r = await db.getFirstAsync<any>("SELECT * FROM comercios WHERE id = ?", [id]);
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    rubroId: r.rubroId,
    descripcion: r.descripcion,
    direccion: r.direccion,
    coordenadas: {
      latitud: r.latitud,
      longitud: r.longitud,
    },
    telefono: r.telefono,
    whatsapp: r.whatsapp,
    instagram: r.instagram,
    imagenes: JSON.parse(r.imagenes || "[]"),
    videoUrl: r.videoUrl,
    horarios: JSON.parse(r.horarios || "[]"),
    mediosDePago: JSON.parse(r.mediosDePago || "[]"),
    puntaje: r.puntaje,
    cantidadResenas: r.cantidadResenas,
    codigoQr: r.codigoQr,
    activo: r.activo === 1,
  };
}

export async function guardarRubrosEnDB(rubros: Rubro[]): Promise<void> {
  const db = await getDatabase();
  for (const r of rubros) {
    await db.runAsync(
      "INSERT OR REPLACE INTO rubros (id, nombre, icono, color, orden) VALUES (?, ?, ?, ?, ?)",
      [r.id, r.nombre, r.icono, r.color, r.orden]
    );
  }
}

export async function obtenerRubrosDeDB(): Promise<Rubro[]> {
  const db = await getDatabase();
  return db.getAllAsync<Rubro>("SELECT * FROM rubros ORDER BY orden ASC");
}

export async function setKV(key: string, value: string): Promise<void> {
  await Storage.setItem(key, value);
}

export async function getKV(key: string): Promise<string | null> {
  return Storage.getItem(key);
}

export async function removeKV(key: string): Promise<void> {
  await Storage.removeItem(key);
}
