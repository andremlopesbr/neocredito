import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { authMiddleware } from './shared/middlewares/auth.middleware';
import { roleMiddleware } from './shared/middlewares/role.middleware';
import { AuthController } from './modules/auth/auth.controller';
import { PropostaController } from './modules/propostas/proposta.controller';

const app = express();

// Middlewares globais obrigatórios
app.use(cors());
app.use(express.json());

// Configuração do Swagger OpenAPI
const swaggerPath = path.resolve(__dirname, '../docs/swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Instanciação dos controladores (MVC-ish / Resource oriented)
const authController = new AuthController();
const propostaController = new PropostaController();

// ----------------------------------------------------
// Rotas de Autenticação (US-02)
// ----------------------------------------------------
app.post('/auth/login', authController.login);
app.get('/auth/me', authMiddleware, authController.me);

// ----------------------------------------------------
// Rotas de Propostas de Crédito (US-01 / US-02)
// ----------------------------------------------------
app.post('/propostas', authMiddleware, propostaController.criar);
app.get('/propostas', authMiddleware, propostaController.listar);
app.get('/propostas/:id', authMiddleware, propostaController.obterPorId);

// Regra US-02: Apenas OPERADOR pode atualizar o status de propostas (AC3 US-02)
app.patch(
  '/propostas/:id/status',
  authMiddleware,
  roleMiddleware(['OPERADOR']),
  propostaController.atualizarStatus
);

// Soft delete: acionado via DELETE (US-01 / US-02 com restrições por ator)
app.delete('/propostas/:id', authMiddleware, propostaController.cancelar);

// Rota de Health Check simples e semântica
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware global de erros (deve ser o último registrado)
app.use(errorMiddleware);

export default app;
