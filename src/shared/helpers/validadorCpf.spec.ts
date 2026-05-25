import { validarCpf, limparCpf } from './validadorCpf';

describe('Validador de CPF', () => {
  
  describe('CPFs Válidos', () => {
    test('deve retornar verdadeiro para CPFs válidos com e sem máscara', () => {
      // CPF válido de teste 1
      expect(validarCpf('11144477735')).toBe(true);
      expect(validarCpf('111.444.777-35')).toBe(true);
      
      // CPF válido de teste 2
      expect(validarCpf('22255588846')).toBe(true);
      expect(validarCpf('222.555.888-46')).toBe(true);

      // CPF válido de teste 3
      expect(validarCpf('333.666.999-57')).toBe(true);
    });
  });

  describe('CPFs Inválidos', () => {
    test('deve retornar falso para CPFs com dígitos repetidos', () => {
      expect(validarCpf('00000000000')).toBe(false);
      expect(validarCpf('111.111.111-11')).toBe(false);
      expect(validarCpf('99999999999')).toBe(false);
    });

    test('deve retornar falso para CPFs com tamanho menor ou maior que 11 dígitos', () => {
      expect(validarCpf('123456789')).toBe(false);
      expect(validarCpf('123456789012')).toBe(false);
    });

    test('deve retornar falso para CPFs com dígitos verificadores inconsistentes', () => {
      // Alterando os últimos dígitos verificadores do CPF válido
      expect(validarCpf('111.444.777-99')).toBe(false);
      expect(validarCpf('22255588800')).toBe(false);
    });

    test('deve retornar falso para entradas nulas ou vazias', () => {
      expect(validarCpf('')).toBe(false);
    });
  });

  describe('Função de Limpeza de Caracteres', () => {
    test('deve remover todos os caracteres não numéricos', () => {
      expect(limparCpf('123.456.789-00')).toBe('12345678900');
      expect(limparCpf('abc123def')).toBe('123');
    });
  });
});
