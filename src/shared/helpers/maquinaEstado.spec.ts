import { STATUS, validarTransicaoStatus } from './maquinaEstado';

describe('Máquina de Estados de Propostas', () => {
  
  describe('Transições Permitidas (Caminhos Felizes)', () => {
    test('deve permitir transição de RASCUNHO para EM_ANALISE', () => {
      expect(() => validarTransicaoStatus(STATUS.RASCUNHO, STATUS.EM_ANALISE)).not.toThrow();
    });

    test('deve permitir transição de RASCUNHO para CANCELADA', () => {
      expect(() => validarTransicaoStatus(STATUS.RASCUNHO, STATUS.CANCELADA)).not.toThrow();
    });

    test('deve permitir transição de EM_ANALISE para APROVADA', () => {
      expect(() => validarTransicaoStatus(STATUS.EM_ANALISE, STATUS.APROVADA)).not.toThrow();
    });

    test('deve permitir transição de EM_ANALISE para REPROVADA', () => {
      expect(() => validarTransicaoStatus(STATUS.EM_ANALISE, STATUS.REPROVADA)).not.toThrow();
    });

    test('deve permitir transição de EM_ANALISE para CANCELADA', () => {
      expect(() => validarTransicaoStatus(STATUS.EM_ANALISE, STATUS.CANCELADA)).not.toThrow();
    });
  });

  describe('Transições Inválidas (Rejeitadas)', () => {
    test('deve rejeitar transições diretas de RASCUNHO para APROVADA ou REPROVADA', () => {
      expect(() => validarTransicaoStatus(STATUS.RASCUNHO, STATUS.APROVADA)).toThrow();
      expect(() => validarTransicaoStatus(STATUS.RASCUNHO, STATUS.REPROVADA)).toThrow();
    });

    test('deve rejeitar cancelamento a partir do status terminal APROVADA', () => {
      expect(() => validarTransicaoStatus(STATUS.APROVADA, STATUS.CANCELADA)).toThrow();
    });

    test('deve rejeitar qualquer alteração a partir do status terminal REPROVADA', () => {
      expect(() => validarTransicaoStatus(STATUS.REPROVADA, STATUS.EM_ANALISE)).toThrow();
      expect(() => validarTransicaoStatus(STATUS.REPROVADA, STATUS.APROVADA)).toThrow();
      expect(() => validarTransicaoStatus(STATUS.REPROVADA, STATUS.CANCELADA)).toThrow();
    });

    test('deve rejeitar qualquer alteração a partir do status terminal CANCELADA', () => {
      expect(() => validarTransicaoStatus(STATUS.CANCELADA, STATUS.EM_ANALISE)).toThrow();
      expect(() => validarTransicaoStatus(STATUS.CANCELADA, STATUS.RASCUNHO)).toThrow();
    });

    test('deve rejeitar status inexistentes ou desconhecidos', () => {
      expect(() => validarTransicaoStatus('STATUS_INEXISTENTE', STATUS.EM_ANALISE)).toThrow();
      expect(() => validarTransicaoStatus(STATUS.RASCUNHO, 'STATUS_DESCONHECIDO')).toThrow();
    });
  });
});
