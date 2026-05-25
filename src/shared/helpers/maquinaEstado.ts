/**
 * Máquina de Estados para gerenciamento e validação de transições de status das propostas.
 */

export const STATUS = {
  RASCUNHO: 'RASCUNHO',
  EM_ANALISE: 'EM_ANALISE',
  APROVADA: 'APROVADA',
  REPROVADA: 'REPROVADA',
  CANCELADA: 'CANCELADA',
} as const;

export type PropostaStatus = typeof STATUS[keyof typeof STATUS];

// Transições válidas explícitas
const TRANSOES_VALIDAS: Record<PropostaStatus, PropostaStatus[]> = {
  [STATUS.RASCUNHO]: [STATUS.EM_ANALISE, STATUS.CANCELADA],
  [STATUS.EM_ANALISE]: [STATUS.APROVADA, STATUS.REPROVADA, STATUS.CANCELADA],
  [STATUS.APROVADA]: [], // Estado Terminal
  [STATUS.REPROVADA]: [], // Estado Terminal
  [STATUS.CANCELADA]: [], // Estado Terminal
};

/**
 * Valida a transição de um status atual para o novo status.
 * Lança um erro descritivo caso a transição não seja permitida.
 */
export function validarTransicaoStatus(statusAtual: string, novoStatus: string): void {
  // Garantir que os status fornecidos são válidos no sistema
  const statusValidos = Object.values(STATUS) as string[];
  
  if (!statusValidos.includes(statusAtual)) {
    throw new Error(`Status atual '${statusAtual}' inválido no sistema.`);
  }
  
  if (!statusValidos.includes(novoStatus)) {
    throw new Error(`Novo status '${novoStatus}' inválido no sistema.`);
  }

  // Casos terminais e regras especiais
  if (statusAtual === STATUS.APROVADA || statusAtual === STATUS.REPROVADA || statusAtual === STATUS.CANCELADA) {
    throw new Error(`Nenhuma transição é permitida a partir do status terminal '${statusAtual}'.`);
  }

  const transicoesPossiveis = TRANSOES_VALIDAS[statusAtual as PropostaStatus];
  
  if (!transicoesPossiveis.includes(novoStatus as PropostaStatus)) {
    throw new Error(`Transição de status inválida: '${statusAtual}' -> '${novoStatus}'.`);
  }
}
