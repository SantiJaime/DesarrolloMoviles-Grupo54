import { z } from 'zod';

const email = z.string().trim().pipe(z.email('Ingresá un email válido.'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});

export const registerSchema = z
  .object({
    nombreCompleto: z.string().trim().min(3, 'Ingresá tu nombre completo.'),
    email,
    password: z.string().min(6, 'Debe tener al menos 6 caracteres.'),
    confirm: z.string().min(1, 'Repetí tu contraseña.'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    error: 'Las contraseñas no coinciden.',
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
