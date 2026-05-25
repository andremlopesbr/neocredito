import { z } from 'zod';
import { validarCpf } from '../../shared/helpers/validadorCpf';
import { STATUS } from '../../shared/helpers/maquinaEstado';

/**
 * Esquema de validação para criação de uma nova proposta (US-01).
 */
export const criarPropostaSchema = z.object({
  clienteNome: z
    .string({ required_error: 'Nome do cliente é obrigatório.' })
    .min(2, { message: 'Nome do cliente deve ter ao menos 2 caracteres.' }),
  clienteCpf: z
    .string({ required_error: 'CPF do cliente é obrigatório.' })
    .refine((val) => validarCpf(val), {
      message: 'CPF inválido ou em formato incorreto. Deve conter 11 dígitos.',
    }),
  clienteRenda: z
    .number({ required_error: 'Renda do cliente é obrigatória.' })
    .positive({ message: 'A renda do cliente deve ser um número positivo.' }),
  valorSolicitado: z
    .number({ required_error: 'Valor solicitado é obrigatório.' })
    .min(500, { message: 'O valor solicitado mínimo é R$ 500,00.' })
    .max(50000, { message: 'O valor solicitado máximo é R$ 50.000,00.' }),
  numeroParcelas: z
    .number({ required_error: 'Número de parcelas é obrigatório.' })
    .refine((val) => [6, 12, 18, 24, 36].includes(val), {
      message: 'Número de parcelas inválido. Valores permitidos: 6, 12, 18, 24 ou 36.',
    }),
});

export type CriarPropostaDTO = z.infer<typeof criarPropostaSchema>;

/**
 * Esquema de validação para consulta de propostas filtradas e paginadas (US-01).
 */
export const listarPropostasSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val)) : 10)),
  status: z
    .enum([STATUS.RASCUNHO, STATUS.EM_ANALISE, STATUS.APROVADA, STATUS.REPROVADA, STATUS.CANCELADA])
    .optional(),
  cpf: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/[^\d]/g, '') : undefined)), // Filtro limpa máscara do CPF
});

export type ListarPropostasDTO = z.infer<typeof listarPropostasSchema>;

/**
 * Esquema de validação para alteração de status da proposta (US-01).
 */
export const atualizarStatusSchema = z.object({
  status: z.enum(
    [STATUS.RASCUNHO, STATUS.EM_ANALISE, STATUS.APROVADA, STATUS.REPROVADA, STATUS.CANCELADA],
    {
      required_error: 'Status é obrigatório.',
      invalid_type_error: 'Status informado é inválido.',
    }
  ),
  motivoReprovacao: z
    .string()
    .min(1, { message: 'Motivo da reprovação não pode ser vazio.' })
    .optional(),
});

export type AtualizarStatusDTO = z.infer<typeof atualizarStatusSchema>;
