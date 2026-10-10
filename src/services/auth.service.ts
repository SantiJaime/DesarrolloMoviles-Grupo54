import type { Usuario } from "@/src/types/models";

import { mockRequest } from "./api/client";

export interface AuthResult {
  usuario: Usuario;
  token: string;
}

export interface RegisterInput {
  nombreCompleto: string;
  email: string;
  password: string;
}

const users: (Usuario & { password: string })[] = [
  {
    id: "usr-demo",
    email: "demo@cccu.com.ar",
    nombreCompleto: "Usuario Demo",
    password: "demo1234",
    biometriaHabilitada: false,
  },
];

const toAuthResult = ({ password: _, ...usuario }: (typeof users)[number]): AuthResult => ({
  usuario,
  token: `mock-token-${usuario.id}`,
});

const findByToken = (token: string) => {
  const user = users.find((u) => `mock-token-${u.id}` === token);
  if (!user) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
  return user;
};

export const authService = {
  login: (email: string, password: string) =>
    mockRequest(() => {
      const user = users.find((u) => u.email === email.toLowerCase() && u.password === password);
      if (!user) throw new Error("El email o la contraseña son incorrectos.");
      return toAuthResult(user);
    }),

  register: (input: RegisterInput) =>
    mockRequest(() => {
      const email = input.email.toLowerCase();
      if (users.some((u) => u.email === email)) {
        throw new Error("Ya existe una cuenta registrada con ese email.");
      }
      const user = { ...input, email, id: `usr-${Date.now()}`, biometriaHabilitada: false };
      users.push(user);
      return toAuthResult(user);
    }),

  me: (token: string) => mockRequest(() => toAuthResult(findByToken(token)).usuario),

  updateMe: (token: string, changes: Pick<Usuario, "biometriaHabilitada">) =>
    mockRequest(() => toAuthResult(Object.assign(findByToken(token), changes)).usuario),

  logout: (_token: string) => mockRequest(() => undefined),
};
