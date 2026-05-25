/**
 * Helper para regras financeiras e cálculos da esteira de propostas.
 */

// Tabela de taxas de juros
const TABELA_TAXAS: Record<string, Record<number, number>> = {
  ATE_5000: {
    6: 0.0199,
    12: 0.0249,
    18: 0.0299,
    24: 0.0349,
    36: 0.0399,
  },
  ATE_15000: {
    6: 0.0149,
    12: 0.0189,
    18: 0.0229,
    24: 0.0279,
    36: 0.0329,
  },
  ACIMA_15000: {
    6: 0.0109,
    12: 0.0139,
    18: 0.0179,
    24: 0.0219,
    36: 0.0279,
  },
};

/**
 * Retorna a taxa de juros correspondente com base no valor solicitado e no número de parcelas.
 */
export function obterTaxaJuros(valorSolicitado: number, numeroParcelas: number): number {
  let faixa = 'ATE_5000';
  if (valorSolicitado > 5000 && valorSolicitado <= 15000) {
    faixa = 'ATE_15000';
  } else if (valorSolicitado > 15000) {
    faixa = 'ACIMA_15000';
  }

  const taxasPorParcela = TABELA_TAXAS[faixa];
  if (!taxasPorParcela || !(numeroParcelas in taxasPorParcela)) {
    throw new Error(`Número de parcelas ${numeroParcelas} não é permitido.`);
  }

  return taxasPorParcela[numeroParcelas];
}

/**
 * Arredonda um número decimal para duas casas decimais (padrão de centavos).
 */
export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula o valor da parcela (Fórmula Price) e o total a pagar de forma arredondada.
 */
export function calcularPropostaFinanceira(valorSolicitado: number, numeroParcelas: number) {
  const taxa = obterTaxaJuros(valorSolicitado, numeroParcelas);
  
  // Fórmula Price: valorParcela = valorSolicitado * (taxa * (1 + taxa)^n) / ((1 + taxa)^n - 1)
  const fator = Math.pow(1 + taxa, numeroParcelas);
  const valorParcelaSemArredondar = valorSolicitado * (taxa * fator) / (fator - 1);
  
  const valorParcela = arredondar(valorParcelaSemArredondar);
  const totalAPagar = arredondar(valorParcela * numeroParcelas);
  
  return {
    taxaJuros: taxa,
    valorParcela,
    totalAPagar,
  };
}
