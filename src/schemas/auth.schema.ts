import { z } from "zod";

const email = z.string().trim().email("Ingresá un email válido.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const registerSchema = z
  .object({
    nombre: z.string().trim().min(3, "Ingresá tu nombre completo."),
    email,
    password: z.string().min(6, "Debe tener al menos 6 caracteres."),
    confirm: z.string().min(1, "Repetí tu contraseña."),
    rol: z.enum(["vecino", "comercio"]),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden.",
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
