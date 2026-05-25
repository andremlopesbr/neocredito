import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { calcularPropostaFinanceira } from '../src/shared/helpers/calculadora';
import { STATUS } from '../src/shared/helpers/maquinaEstado';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de dados...');

  // Hashing de senha padrão
  const senhaPadrao = 'Teste@2024';
  const saltRounds = 10;
  const senhaHash = await bcrypt.hash(senhaPadrao, saltRounds);

  // 1. Criar usuários CORBAN e OPERADOR
  const corban1 = await prisma.usuario.upsert({
    where: { email: 'corban1@neocredito.com.br' },
    update: { senhaHash },
    create: {
      email: 'corban1@neocredito.com.br',
      senhaHash,
      perfil: 'CORBAN',
      corbanId: 'corban-1-uuid-parceiro',
    },
  });

  const corban2 = await prisma.usuario.upsert({
    where: { email: 'corban2@neocredito.com.br' },
    update: { senhaHash },
    create: {
      email: 'corban2@neocredito.com.br',
      senhaHash,
      perfil: 'CORBAN',
      corbanId: 'corban-2-uuid-parceiro',
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@neocredito.com.br' },
    update: { senhaHash },
    create: {
      email: 'operador@neocredito.com.br',
      senhaHash,
      perfil: 'OPERADOR',
      corbanId: null,
    },
  });

  console.log('Usuários populados com sucesso.');

  // Limpar propostas antigas do seed para ter dados limpos e controlados
  await prisma.proposta.deleteMany({});

  // 2. Criar 5 propostas com cálculos reais distribuídas entre os CORBANs
  
  // Proposta 1 (CORBAN 1) - RASCUNHO
  const calc1 = calcularPropostaFinanceira(4000, 12);
  await prisma.proposta.create({
    data: {
      clienteNome: 'João da Silva',
      clienteCpf: '11144477735', // CPF válido de teste sintático
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

  // Proposta 2 (CORBAN 1) - EM_ANALISE
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

  // Proposta 3 (CORBAN 1) - APROVADA
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

  // Proposta 4 (CORBAN 2) - REPROVADA
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

  // Proposta 5 (CORBAN 2) - CANCELADA
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

  console.log('Seed de 5 propostas concluído com juros e parcelas calculadas automaticamente.');
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
