import { z } from 'zod';

/**
 * Esquema de validação de dados de entrada para autenticação (Login).
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório.' })
    .email({ message: 'E-mail em formato inválido.' }),
  senha: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(1, { message: 'Senha não pode ser vazia.' }),
});

export type LoginDTO = z.infer<typeof loginSchema>;
