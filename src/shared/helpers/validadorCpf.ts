/**
 * Validador de CPF brasileiro (aceita com e sem formatação).
 */

export function limparCpf(cpf: string): string {
  return cpf.replace(/[^\d]/g, '');
}

export function validarCpf(cpf: string): boolean {
  if (!cpf) return false;

  const cpfLimpo = limparCpf(cpf);

  // CPF deve ter exatamente 11 dígitos numéricos
  if (cpfLimpo.length !== 11) return false;

  // Rejeita CPFs conhecidos com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
}
