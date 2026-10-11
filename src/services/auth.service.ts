import type { Rol, Usuario } from "@/src/tipos";
import { MOCK_USUARIOS } from "@/src/mocks";
import { setKV, getKV } from "@/src/lib/db";

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

let usuariosRegistrados = [...MOCK_USUARIOS];

async function simularLatencia<T>(accion: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return accion();
}

const toAuthResult = ({ password: _, ...usuario }: (typeof usuariosRegistrados)[number]): AuthResult => ({
  usuario,
  token: `token-${usuario.id}-${Date.now()}`,
});

export const authService = {
  login: (email: string, password: string) =>
    simularLatencia(() => {
      const emailNorm = email.toLowerCase().trim();
      const user = usuariosRegistrados.find(
        (u) => (u.email.toLowerCase() === emailNorm || (emailNorm === "demo@cccu.com.ar" && u.email === "marta@mail.com")) && u.password === password
      );
      if (!user) {
        throw new Error("El email o la contraseña son incorrectos.");
      }
      return toAuthResult(user);
    }),

  register: (input: RegisterInput) =>
    simularLatencia(() => {
      const email = input.email.toLowerCase().trim();
      if (usuariosRegistrados.some((u) => u.email === email)) {
        throw new Error("Ya existe una cuenta registrada con ese email.");
      }
      const nuevo: (Usuario & { password: string }) = {
        id: `usr-${Date.now()}`,
        nombre: input.nombre,
        email,
        password: input.password,
        rol: input.rol || "vecino",
        comercioId: input.rol === "comercio" ? "com-118" : null,
        favoritos: [],
        rubrosDeInteres: [],
        avisosActivos: true,
        biometriaHabilitada: false,
      };
      usuariosRegistrados.push(nuevo);
      return toAuthResult(nuevo);
    }),

  me: (token: string) =>
    simularLatencia(() => {
      const partes = token.split("-");
      const userId = partes.length >= 2 ? `${partes[0]}-${partes[1]}` : null;
      const user = usuariosRegistrados.find((u) => u.id === userId) || usuariosRegistrados[0];
      const { password: _, ...sinPass } = user;
      return sinPass;
    }),

  updateMe: (token: string, changes: Partial<Usuario>) =>
    simularLatencia(() => {
      const partes = token.split("-");
      const userId = partes.length >= 2 ? `${partes[0]}-${partes[1]}` : null;
      const user = usuariosRegistrados.find((u) => u.id === userId) || usuariosRegistrados[0];
      Object.assign(user, changes);
      const { password: _, ...sinPass } = user;
      return sinPass;
    }),

  logout: (_token: string) => simularLatencia(() => undefined),
};
