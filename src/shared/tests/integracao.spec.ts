import request from 'supertest';
import app from '../../app';
import { prisma } from '../database/prisma';
import { STATUS } from '../helpers/maquinaEstado';

describe('Testes de Integração — API Neo Crédito', () => {
  let tokenCorban1: string;
  let tokenCorban2: string;
  let tokenOperador: string;

  let propostaCorban1Id: string;
  let propostaCorban2Id: string;

  // Antes de iniciar a suíte de testes de integração, vamos obter os tokens JWT reais dos usuários do Seed
  beforeAll(async () => {
    // Obter token do CORBAN 1
    const resCorban1 = await request(app)
      .post('/auth/login')
      .send({ email: 'corban1@neocredito.com.br', senha: 'Teste@2024' });
    tokenCorban1 = resCorban1.body.token;

    // Obter token do CORBAN 2
    const resCorban2 = await request(app)
      .post('/auth/login')
      .send({ email: 'corban2@neocredito.com.br', senha: 'Teste@2024' });
    tokenCorban2 = resCorban2.body.token;

    // Obter token do OPERADOR
    const resOperador = await request(app)
      .post('/auth/login')
      .send({ email: 'operador@neocredito.com.br', senha: 'Teste@2024' });
    tokenOperador = resOperador.body.token;
  });

  // Fecha conexão com banco no fim dos testes
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Módulo de Autenticação', () => {
    test('POST /auth/login — deve rejeitar credenciais inválidas com HTTP 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'corban1@neocredito.com.br', senha: 'SenhaIncorreta' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('POST /auth/login — deve retornar token JWT válido para credenciais corretas', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'operador@neocredito.com.br', senha: 'Teste@2024' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario.perfil).toBe('OPERADOR');
    });

    test('GET /auth/me — deve retornar o perfil correto a partir do JWT', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenCorban1}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('corban1@neocredito.com.br');
      expect(res.body.perfil).toBe('CORBAN');
    });

    test('GET /auth/me — deve retornar HTTP 401 se token for inválido', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer token_invalido_quebrado');

      expect(res.status).toBe(401);
    });
  });

  describe('Módulo de Propostas de Crédito — Fluxos de CRUD', () => {
    
    test('POST /propostas — deve criar proposta como RASCUNHO e calcular juros/parcelas automaticamente', async () => {
      const res = await request(app)
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenCorban1}`)
        .send({
          clienteNome: 'Fernando Henrique',
          clienteCpf: '111.444.777-35', // CPF válido
          clienteRenda: 5000.0,
          valorSolicitado: 3000.0,
          numeroParcelas: 12,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(STATUS.RASCUNHO);
      expect(res.body.valorParcela).toBe(292.28); // Cálculo correto da Price
      expect(res.body.totalAPagar).toBe(3507.36);
      propostaCorban1Id = res.body.id;
    });

    test('POST /propostas — deve validar campos obrigatórios e rejeitar valores limítrofes inválidos com HTTP 400', async () => {
      const res = await request(app)
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenCorban1}`)
        .send({
          clienteNome: 'A', // Nome muito curto
          clienteCpf: '12345678900', // CPF matematicamente inválido
          clienteRenda: -100.0, // Renda negativa
          valorSolicitado: 60000.0, // Acima de R$ 50.000
          numeroParcelas: 5, // Parcelas inválidas
        });

      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThanOrEqual(4);
    });

    test('GET /propostas — CORBAN só deve listar suas próprias propostas', async () => {
      // Criar uma proposta para o CORBAN 2 para isolamento
      const resCriar2 = await request(app)
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenCorban2}`)
        .send({
          clienteNome: 'Mariana Lima',
          clienteCpf: '222.555.888-46',
          clienteRenda: 6000.0,
          valorSolicitado: 8000.0,
          numeroParcelas: 18,
        });
      propostaCorban2Id = resCriar2.body.id;

      // Buscar listagem como CORBAN 1
      const resListar1 = await request(app)
        .get('/propostas')
        .set('Authorization', `Bearer ${tokenCorban1}`);

      // Valida que nenhuma proposta do CORBAN 2 veio na resposta
      const contemProposta2 = resListar1.body.dados.some(
        (p: any) => p.id === propostaCorban2Id
      );
      expect(contemProposta2).toBe(false);
    });

    test('GET /propostas — OPERADOR deve conseguir listar todas as propostas', async () => {
      const resListarOp = await request(app)
        .get('/propostas')
        .set('Authorization', `Bearer ${tokenOperador}`);

      // Valida que o OPERADOR visualizou a proposta do CORBAN 1 e do CORBAN 2
      const contemProposta1 = resListarOp.body.dados.some(
        (p: any) => p.id === propostaCorban1Id
      );
      const contemProposta2 = resListarOp.body.dados.some(
        (p: any) => p.id === propostaCorban2Id
      );

      expect(contemProposta1).toBe(true);
      expect(contemProposta2).toBe(true);
    });

    test('GET /propostas/:id — CORBAN 2 não deve conseguir ler proposta do CORBAN 1 retornando HTTP 403', async () => {
      const res = await request(app)
        .get(`/propostas/${propostaCorban1Id}`)
        .set('Authorization', `Bearer ${tokenCorban2}`);

      expect(res.status).toBe(403);
    });

    test('PATCH /propostas/:id/status — CORBAN não pode atualizar status de proposta retornando HTTP 403', async () => {
      const res = await request(app)
        .patch(`/propostas/${propostaCorban1Id}/status`)
        .set('Authorization', `Bearer ${tokenCorban1}`)
        .send({ status: STATUS.EM_ANALISE });

      expect(res.status).toBe(403);
    });

    test('PATCH /propostas/:id/status — OPERADOR pode transitar status respeitando máquina de estados', async () => {
      // 1. Transitar RASCUNHO -> EM_ANALISE (Permitido)
      const res1 = await request(app)
        .patch(`/propostas/${propostaCorban1Id}/status`)
        .set('Authorization', `Bearer ${tokenOperador}`)
        .send({ status: STATUS.EM_ANALISE });

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe(STATUS.EM_ANALISE);

      // 2. Transitar EM_ANALISE -> REPROVADA sem motivo (Deve Falhar 400)
      const res2 = await request(app)
        .patch(`/propostas/${propostaCorban1Id}/status`)
        .set('Authorization', `Bearer ${tokenOperador}`)
        .send({ status: STATUS.REPROVADA });
      
      expect(res2.status).toBe(400);

      // 3. Transitar EM_ANALISE -> REPROVADA com motivo (Permitido)
      const res3 = await request(app)
        .patch(`/propostas/${propostaCorban1Id}/status`)
        .set('Authorization', `Bearer ${tokenOperador}`)
        .send({ status: STATUS.REPROVADA, motivoReprovacao: 'Score baixo' });
      
      expect(res3.status).toBe(200);
      expect(res3.body.status).toBe(STATUS.REPROVADA);
      expect(res3.body.motivoReprovacao).toBe('Score baixo');

      // 4. Transitar de REPROVADA para EM_ANALISE (Inválido - Terminal - HTTP 422)
      const res4 = await request(app)
        .patch(`/propostas/${propostaCorban1Id}/status`)
        .set('Authorization', `Bearer ${tokenOperador}`)
        .send({ status: STATUS.EM_ANALISE });

      expect(res4.status).toBe(422);
    });

    test('DELETE /propostas/:id — CORBAN não pode cancelar proposta que não esteja em RASCUNHO', async () => {
      // Como propostaCorban1Id está no status REPROVADA
      const res = await request(app)
        .delete(`/propostas/${propostaCorban1Id}`)
        .set('Authorization', `Bearer ${tokenCorban1}`);

      expect(res.status).toBe(403);
    });

    test('DELETE /propostas/:id — CORBAN pode cancelar RASCUNHO próprio realizando Soft Delete', async () => {
      // 1. Criar novo rascunho
      const resCriar = await request(app)
        .post('/propostas')
        .set('Authorization', `Bearer ${tokenCorban1}`)
        .send({
          clienteNome: 'Carlos Eduardo',
          clienteCpf: '111.444.777-35',
          clienteRenda: 4000.0,
          valorSolicitado: 2000.0,
          numeroParcelas: 6,
        });
      const novoRascunhoId = resCriar.body.id;

      // 2. Chamar o DELETE
      const resDelete = await request(app)
        .delete(`/propostas/${novoRascunhoId}`)
        .set('Authorization', `Bearer ${tokenCorban1}`);

      expect(resDelete.status).toBe(200);
      expect(resDelete.body.status).toBe(STATUS.CANCELADA);

      // 3. Confirmar que a proposta continua salva na base de dados (Soft Delete)
      const propostaNaBase = await prisma.proposta.findUnique({
        where: { id: novoRascunhoId },
      });
      expect(propostaNaBase).not.toBeNull();
      expect(propostaNaBase?.status).toBe(STATUS.CANCELADA);
    });
  });
});
