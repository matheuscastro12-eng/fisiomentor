import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
  cref: z
    .string()
    .min(4, "CREF inválido")
    .regex(/^\d{4,6}-G\/[A-Z]{2}$/, "Formato: 012345-G/SP"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z
    .string()
    .min(1, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
