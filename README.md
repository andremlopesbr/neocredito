# API Neo Crédito — Módulo de Propostas de Crédito (MVP)

Esta é a implementação da API REST que orquestra a esteira de propostas de crédito da Neo Crédito. O projeto foi estruturado utilizando princípios de **Clean Architecture** e **SOLID**, visando garantir o desacoplamento das regras de negócio (cálculo financeiro e transições de status) das tecnologias de infraestrutura.

---

## 🛠️ Stack Tecnológica

* **Runtime**: Node.js (v18+)
* **Linguagem**: TypeScript (compilação estrita)
* **Framework**: Express
* **ORM**: Prisma (SQLite para portabilidade ágil do banco em arquivo local)
* **Validação**: Zod (validação de payloads e contratos de borda)
* **Segurança**: Bcrypt (hashing de senhas) e JWT (tokens com validade de 8 horas)
* **Testes**: Jest + Supertest (testes unitários e de integração E2E)

---

## 💻 Instalação e Inicialização Local

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
O arquivo `.env` já foi criado automaticamente na raiz do projeto contendo as seguintes configurações:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key-neo-credito-2026-development-only"
JWT_EXPIRES_IN="8h"
```

### 3. Banco de Dados e Carga de Seed
A base SQLite é gerada e populada de forma automatizada na primeira execução do servidor. Caso queira rodar o processo manualmente:
```bash
# Executa migrações estruturais
npx prisma migrate dev --name init

# Popula usuários e propostas iniciais
npm run prisma:seed
```

#### Credenciais do Seed (Senha Padrão para todos: `Teste@2024`):
* **OPERADOR**: `operador@neocredito.com.br`
* **CORBAN 1**: `corban1@neocredito.com.br`
* **CORBAN 2**: `corban2@neocredito.com.br`

### 4. Executar a API
* **Modo de Desenvolvimento (Hot reload)**:
  ```bash
  npm run dev
  ```
* **Modo de Produção**:
  ```bash
  npm run build
  npm start
  ```

---

## 🐳 Inicialização com Docker (Diferencial)

A aplicação conta com suporte a contêineres multi-estágios, que compilam o código e geram a base de dados pré-migrada e semeada na imagem final:
```bash
docker-compose up --build
```
A API estará disponível localmente em `http://localhost:3000`.

---

## 📖 Documentação Interativa da API (Swagger)

Todos os contratos de rotas, esquemas Zod de entrada e respostas JSON de erro estão documentados. Com a aplicação rodando, acesse:
* **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🧪 Suíte de Testes Automatizados

Foram criados **35 cenários de testes sequenciais** cobrindo testes unitários de lógica pura do domínio e testes de integração de ponta a ponta com simulação de rotas HTTP.

Para executar todos os testes:
```bash
npm test
```

Para gerar o relatório detalhado de cobertura de código (mantida acima de 80%):
```bash
npm run test:coverage
```

---

## 💡 Decisões Técnicas & Justificativas - Decisões Tomadas

1. **SQLite + Prisma ORM**: Adotados para agilizar o ambiente local de testes do avaliador. A base reside em arquivo físico embarcado, o que zera a necessidade de subir servidores de banco adicionais (PostgreSQL/MySQL). A portabilidade é imediata e a troca de driver requer apenas a edição da URL no `.env`.
2. **Cálculo da Parcela (Price Clássico)**: O arredondamento de centavos (2 casas decimais) é realizado no valor da parcela calculada e, a partir dele, obtém-se o total a pagar (`valorParcela * numeroParcelas`), refletindo a transação financeira da vida real sem sobras de dízimas periódicas.
3. **Isolamento Multitenant (Papéis CORBAN)**: CORBANs são restritos por um middleware de segurança. A API injeta o `corbanId` do token e filtra de forma implícita as listagens de propostas. A tentativa de acessar um ID que não pertence ao próprio CORBAN retorna erro `HTTP 403 Forbidden` (em conformidade absoluta com as especificações exigidas na **US-02**).
4. **Respostas e Padronização de Erros**: Toda a aplicação é amparada por um middleware global de exceções, padronizando retornos em `{ error, details }`. Erros Zod geram `HTTP 400`, transições inválidas na máquina de estados geram `HTTP 422` e falhas de autorização geram `HTTP 401` ou `HTTP 403`.

---

## 🔄 O que faria diferente com mais tempo - Próximos Passos

1. **Migração para PostgreSQL**: Em um cenário real de alta concorrência em produção, substituiria o SQLite pelo PostgreSQL para garantir suporte a transações isoladas complexas (locks) e melhor paralelismo sob cargas severas.
2. **Geração Dinâmica do Swagger**: Implementaria TSOA para expor o Swagger dinamicamente com base nas anotações do próprio TypeScript no código, eliminando a manutenção paralela de um arquivo JSON estático apartado.
3. **Repository Pattern Completo**: Desacoplaria inteiramente a chamada direta ao Prisma no Service por trás de interfaces de repositórios customizadas. Isso blindaria a regra de negócio do ORM adotado, permitindo trocas transparentes no futuro.
4. **CI/CD Integrado**: Configuraria workflows no GitHub Actions para automatizar a validação estática de tipos, análise linter de formatação e execução da suíte de testes a cada Pull Request.
