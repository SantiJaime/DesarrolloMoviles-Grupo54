import { Directory, File, Paths } from "expo-file-system";

export async function guardarFotoEnAlmacenamiento(
  origenUri: string,
  nombreArchivo: string
): Promise<string> {
  try {
    const destinoDir = new Directory(Paths.document, "fotos");
    if (!destinoDir.exists) {
      destinoDir.create();
    }

    const archivoDestino = new File(destinoDir, `${Date.now()}_${nombreArchivo}`);
    const archivoOrigen = new File(origenUri);

    if (archivoOrigen.exists) {
      archivoOrigen.copy(archivoDestino);
      return archivoDestino.uri;
    }
    return origenUri;
  } catch {
    return origenUri;
  }
}

export function obtenerDirectorioCache(): string {
  return Paths.cache.uri;
}
