import { Directory, File, Paths } from "expo-file-system";
import { guardarArchivoCache, leerArchivoCache } from "@/src/lib/db";
import type { Comercio } from "@/src/tipos";

export async function guardarFotoEnAlmacenamiento(
  origenUri: string,
  nombreArchivo: string,
): Promise<string> {
  const dir = new Directory(Paths.document, "fotos");
  dir.create({ intermediates: true, idempotent: true });
  const destino = new File(
    dir,
    `${Date.now()}_${nombreArchivo.replace(/[^\w.-]/g, "_")}`,
  );
  const origen = new File(origenUri);
  if (!origen.exists)
    throw new Error(
      "No se pudo leer el archivo seleccionado. Volvé a elegirlo.",
    );
  origen.copy(destino);
  return destino.uri;
}

export async function obtenerArchivoLocal(url: string): Promise<string> {
  if (!/^https?:\/\//.test(url)) return url;
  const uri = await leerArchivoCache(url);
  return uri && new File(uri).exists ? uri : url;
}

const descargas = new Map<string, Promise<string>>();
export async function descargarArchivo(url: string): Promise<string> {
  const local = await obtenerArchivoLocal(url);
  if (local !== url || !/^https?:\/\//.test(url)) return local;
  if (descargas.has(url)) return descargas.get(url)!;
  const descarga = (async () => {
    const dir = new Directory(Paths.document, "fichas");
    dir.create({ intermediates: true, idempotent: true });
    const extension =
      url.split("?")[0].match(/\.(mp4|mov|jpg|jpeg|png|webp)$/i)?.[1] ?? "bin";
    const nombre = `${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
    const file = await File.downloadFileAsync(url, new File(dir, nombre));
    await guardarArchivoCache(url, file.uri);
    return file.uri;
  })();
  descargas.set(url, descarga);
  try {
    return await descarga;
  } finally {
    descargas.delete(url);
  }
}

export async function resolverMultimedia(
  comercio: Comercio,
): Promise<Comercio> {
  return {
    ...comercio,
    imagenes: await Promise.all(comercio.imagenes.map(obtenerArchivoLocal)),
    videoUrl: comercio.videoUrl
      ? await obtenerArchivoLocal(comercio.videoUrl)
      : null,
  };
}

export async function guardarFichaSinConexion(
  comercio: Comercio,
): Promise<Comercio> {
  await Promise.all(
    [
      ...comercio.imagenes,
      ...(comercio.videoUrl ? [comercio.videoUrl] : []),
    ].map(descargarArchivo),
  );
  return resolverMultimedia(comercio);
}

export function obtenerDirectorioCache(): string {
  return Paths.cache.uri;
}
