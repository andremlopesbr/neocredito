import app from './app';
import { prisma } from './shared/database/prisma';
import bcrypt from 'bcrypt';
import { STATUS } from './shared/helpers/maquinaEstado';
import { calcularPropostaFinanceira } from './shared/helpers/calculadora';

const PORT = process.env.PORT || 3000;

/**
 * Função para garantir que o banco de dados possua os dados iniciais do seed
 * caso ele esteja sendo iniciado pela primeira vez.
 */
async function garantirDadosIniciais() {
  try {
    const totalUsuarios = await prisma.usuario.count();
    
    if (totalUsuarios === 0) {
      console.log('--- Banco de dados vazio. Iniciando Auto-Seed de desenvolvimento... ---');

      const senhaPadrao = 'Teste@2024';
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(senhaPadrao, saltRounds);

      // Criar usuários do desafio
      const corban1 = await prisma.usuario.create({
        data: {
          email: 'corban1@neocredito.com.br',
          senhaHash,
          perfil: 'CORBAN',
          corbanId: 'corban-1-uuid-parceiro',
        },
      });

      const corban2 = await prisma.usuario.create({
        data: {
          email: 'corban2@neocredito.com.br',
          senhaHash,
          perfil: 'CORBAN',
          corbanId: 'corban-2-uuid-parceiro',
        },
      });

      await prisma.usuario.create({
        data: {
          email: 'operador@neocredito.com.br',
          senhaHash,
          perfil: 'OPERADOR',
          corbanId: null,
        },
      });

      // Criar propostas de teste com juros calculados
      const calc1 = calcularPropostaFinanceira(4000, 12);
      await prisma.proposta.create({
        data: {
          clienteNome: 'João da Silva',
          clienteCpf: '11144477735',
          clienteRenda: 3500.0,
          valorSolicitado: 4000.0,
          numeroParcelas: 12,
          taxaJuros: calc1.taxaJuros,
          valorParcela: calc1.valorParcela,
          totalAPagar: calc1.totalAPagar,
          status: STATUS.RASCUNHO,
          criadoPorId: corban1.id,
        },
      });

      const calc2 = calcularPropostaFinanceira(10000, 24);
      await prisma.proposta.create({
        data: {
          clienteNome: 'Maria de Souza',
          clienteCpf: '22255588813',
          clienteRenda: 5500.0,
          valorSolicitado: 10000.0,
          numeroParcelas: 24,
          taxaJuros: calc2.taxaJuros,
          valorParcela: calc2.valorParcela,
          totalAPagar: calc2.totalAPagar,
          status: STATUS.EM_ANALISE,
          criadoPorId: corban1.id,
        },
      });

      const calc3 = calcularPropostaFinanceira(25000, 36);
      await prisma.proposta.create({
        data: {
          clienteNome: 'Carlos de Oliveira',
          clienteCpf: '33366699902',
          clienteRenda: 12000.0,
          valorSolicitado: 25000.0,
          numeroParcelas: 36,
          taxaJuros: calc3.taxaJuros,
          valorParcela: calc3.valorParcela,
          totalAPagar: calc3.totalAPagar,
          status: STATUS.APROVADA,
          criadoPorId: corban1.id,
        },
      });

      const calc4 = calcularPropostaFinanceira(3000, 6);
      await prisma.proposta.create({
        data: {
          clienteNome: 'Ana Costa',
          clienteCpf: '44477700081',
          clienteRenda: 1200.0,
          valorSolicitado: 3000.0,
          numeroParcelas: 6,
          taxaJuros: calc4.taxaJuros,
          valorParcela: calc4.valorParcela,
          totalAPagar: calc4.totalAPagar,
          status: STATUS.REPROVADA,
          motivoReprovacao: 'Renda mensal insuficiente para o comprometimento da parcela.',
          criadoPorId: corban2.id,
        },
      });

      const calc5 = calcularPropostaFinanceira(15000, 18);
      await prisma.proposta.create({
        data: {
          clienteNome: 'Pedro Santos',
          clienteCpf: '55588811160',
          clienteRenda: 4500.0,
          valorSolicitado: 15000.0,
          numeroParcelas: 18,
          taxaJuros: calc5.taxaJuros,
          valorParcela: calc5.valorParcela,
          totalAPagar: calc5.totalAPagar,
          status: STATUS.CANCELADA,
          criadoPorId: corban2.id,
        },
      });

      console.log('--- Auto-Seed finalizado com sucesso! ---');
    } else {
      console.log(`Base de dados já possui ${totalUsuarios} usuários cadastrados.`);
    }
  } catch (err) {
    console.error('Falha ao garantir dados iniciais no auto-seed:', err);
  }
}

// Inicia o servidor HTTP
app.listen(PORT, async () => {
  console.log(`[Neo Crédito API] Servidor rodando na porta ${PORT}`);
  await garantirDadosIniciais();
});
