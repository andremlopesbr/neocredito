import { obterTaxaJuros, calcularPropostaFinanceira } from './calculadora';

describe('Calculadora Financeira (Regras de Juros e Amortização)', () => {
  
  describe('Obtenção de Taxa de Juros', () => {
    test('deve retornar a taxa correta para a faixa "Até R$ 5.000"', () => {
      // Até R$ 5.000 em 6x -> 1.99%
      expect(obterTaxaJuros(5000, 6)).toBe(0.0199);
      // Até R$ 5.000 em 12x -> 2.49%
      expect(obterTaxaJuros(1000, 12)).toBe(0.0249);
      // Até R$ 5.000 em 36x -> 3.99%
      expect(obterTaxaJuros(4999.99, 36)).toBe(0.0399);
    });

    test('deve retornar a taxa correta para a faixa "De R$ 5.001 a R$ 15.000"', () => {
      // R$ 5.001 em 6x -> 1.49%
      expect(obterTaxaJuros(5001, 6)).toBe(0.0149);
      // R$ 10.000 em 18x -> 2.29%
      expect(obterTaxaJuros(10000, 18)).toBe(0.0229);
      // R$ 15.000 em 36x -> 3.29%
      expect(obterTaxaJuros(15000, 36)).toBe(0.0329);
    });

    test('deve retornar a taxa correta para a faixa "Acima de R$ 15.000"', () => {
      // R$ 15.001 em 6x -> 1.09%
      expect(obterTaxaJuros(15001, 6)).toBe(0.0109);
      // R$ 30.000 em 24x -> 2.19%
      expect(obterTaxaJuros(30000, 24)).toBe(0.0219);
      // R$ 50.000 em 36x -> 2.79%
      expect(obterTaxaJuros(50000, 36)).toBe(0.0279);
    });

    test('deve lançar erro se o número de parcelas for inválido na tabela', () => {
      expect(() => obterTaxaJuros(5000, 5)).toThrow();
      expect(() => obterTaxaJuros(5000, 20)).toThrow();
    });
  });

  describe('Cálculo de Propostas Financeiras', () => {
    test('deve calcular corretamente a parcela e o total usando a fórmula Price', () => {
      // Exemplo: R$ 5.000 solicitado em 12x (Taxa = 2.49% ao mês / 0.0249)
      // Fator = (1.0249)^12 = ~1.34311894
      // Parcela = 5000 * (0.0249 * 1.34311894) / (1.34311894 - 1) = ~487.16
      // Total = 487.16 * 12 = 5845.92
      
      const resultado = calcularPropostaFinanceira(5000.0, 12);
      
      expect(resultado.taxaJuros).toBe(0.0249);
      expect(resultado.valorParcela).toBe(487.14);
      expect(resultado.totalAPagar).toBe(5845.68);
    });

    test('deve calcular com precisão para valores elevados (faixa Acima de R$ 15.000)', () => {
      // Exemplo: R$ 20.000 solicitado em 24x (Taxa = 2.19% ao mês / 0.0219)
      const resultado = calcularPropostaFinanceira(20000.0, 24);
      
      expect(resultado.taxaJuros).toBe(0.0219);
      // Validação das contas
      expect(resultado.valorParcela).toBe(1080.32);
      expect(resultado.totalAPagar).toBe(25927.68);
    });
  });
});
