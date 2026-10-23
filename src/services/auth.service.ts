import type { ApiRespuesta, Rol, Usuario } from "@/src/types";
import { api } from "@/src/services/api/client";

export interface AuthResult {
  usuario: Usuario;
  token: string;
}

export interface RegisterInput {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
}

export type CambiosUsuario = Partial<Pick<Usuario, "nombre" | "rubrosDeInteres" | "avisosActivos">>;

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    const { data } = await api.post<ApiRespuesta<AuthResult>>("/auth/ingreso", {
      email: email.trim(),
      contrasena: password,
    });
    return data.datos;
  },

  async register({ nombre, email, password }: RegisterInput): Promise<AuthResult> {
    const { data } = await api.post<ApiRespuesta<AuthResult>>("/auth/registro", {
      nombre,
      email: email.trim(),
      contrasena: password,
    });
    return data.datos;
  },

  async me(token?: string): Promise<Usuario> {
    const { data } = await api.get<ApiRespuesta<Usuario>>("/yo", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data.datos;
  },

  async updateMe(cambios: CambiosUsuario): Promise<Usuario> {
    const { data } = await api.patch<ApiRespuesta<Usuario>>("/yo", cambios);
    return data.datos;
  },

  async agregarFavorito(comercioId: string): Promise<Usuario> {
    const { data } = await api.put<ApiRespuesta<Usuario>>(`/yo/favoritos/${encodeURIComponent(comercioId)}`);
    return data.datos;
  },

  async quitarFavorito(comercioId: string): Promise<void> {
    await api.delete(`/yo/favoritos/${encodeURIComponent(comercioId)}`);
  },
};
