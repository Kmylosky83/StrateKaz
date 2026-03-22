import { z } from 'zod';

/**
 * Schema Zod compartido para validación de contraseña nueva + confirmación.
 * Usado en SetupPasswordPage y ResetPasswordPage.
 */
export const passwordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirm_password: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

/** Requisitos visuales para indicador de fortaleza de contraseña */
export const PASSWORD_REQUIREMENTS = [
  { label: 'Mínimo 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Una letra mayúscula', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Una letra minúscula', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'Un número', test: (pw: string) => /[0-9]/.test(pw) },
] as const;
