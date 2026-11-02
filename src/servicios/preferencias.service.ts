import { getKV, removeKV, setKV } from "@/src/lib/db";
import { checkNetworkStatus } from "@/src/lib/network";
import { getStoredSession, saveSession } from "@/src/lib/secure-session";
import { api } from "@/src/servicios/api/client";
import type { ApiRespuesta, Usuario } from "@/src/tipos";

type Cambios = {
  favoritos?: Record<string, boolean>;
  rubrosDeInteres?: string[];
  avisosActivos?: boolean;
};
let enCurso: Promise<Usuario | null> | null = null;
const clave = (id: string) => `preferencias_pendientes:${id}`;

export async function aplicarPreferenciasPendientes(
  usuario: Usuario,
): Promise<Usuario> {
  const cambios: Cambios = JSON.parse((await getKV(clave(usuario.id))) ?? "{}");
  const favoritos = new Set(usuario.favoritos);
  for (const [id, agregar] of Object.entries(cambios.favoritos ?? {})) {
    if (agregar) favoritos.add(id);
    else favoritos.delete(id);
  }
  return {
    ...usuario,
    favoritos: [...favoritos],
    rubrosDeInteres: cambios.rubrosDeInteres ?? usuario.rubrosDeInteres,
    avisosActivos: cambios.avisosActivos ?? usuario.avisosActivos,
  };
}

export async function guardarPreferenciasPendientes(
  usuarioId: string,
  cambios: Cambios,
) {
  const anteriores: Cambios = JSON.parse(
    (await getKV(clave(usuarioId))) ?? "{}",
  );
  await setKV(
    clave(usuarioId),
    JSON.stringify({
      ...anteriores,
      ...cambios,
      favoritos: { ...anteriores.favoritos, ...cambios.favoritos },
    }),
  );
}

export async function sincronizarPreferencias(): Promise<Usuario | null> {
  if (enCurso) return enCurso;
  enCurso = (async () => {
    const sesion = await getStoredSession();
    if (!sesion || !(await checkNetworkStatus())) return null;
    const guardado = await getKV(clave(sesion.usuario.id));
    if (!guardado) return null;
    const cambios: Cambios = JSON.parse(guardado);
    const headers = { Authorization: `Bearer ${sesion.token}` };
    const perfil = {
      ...(cambios.rubrosDeInteres !== undefined
        ? { rubrosDeInteres: cambios.rubrosDeInteres }
        : {}),
      ...(cambios.avisosActivos !== undefined
        ? { avisosActivos: cambios.avisosActivos }
        : {}),
    };
    if (Object.keys(perfil).length) await api.patch("/yo", perfil, { headers });
    for (const [id, agregar] of Object.entries(cambios.favoritos ?? {})) {
      if (agregar)
        await api.put(`/yo/favoritos/${encodeURIComponent(id)}`, undefined, {
          headers,
        });
      else
        await api.delete(`/yo/favoritos/${encodeURIComponent(id)}`, {
          headers,
        });
    }
    const { data } = await api.get<ApiRespuesta<Usuario>>("/yo", { headers });
    if ((await getStoredSession())?.usuario.id !== sesion.usuario.id)
      return null;
    if ((await getKV(clave(sesion.usuario.id))) === guardado)
      await removeKV(clave(sesion.usuario.id));
    const usuario = await aplicarPreferenciasPendientes({
      ...data.datos,
      biometriaHabilitada: sesion.usuario.biometriaHabilitada,
    });
    await saveSession(sesion.token, usuario);
    return usuario;
  })();
  try {
    return await enCurso;
  } finally {
    enCurso = null;
  }
}
