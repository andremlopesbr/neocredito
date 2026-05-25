# ==========================================
# Estágio 1: Dependências e Build da Aplicação
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma on Alpine
RUN apk update && apk add --no-cache openssl

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte e configurações do Prisma
COPY src ./src
COPY prisma ./prisma
COPY docs ./docs

# Set DATABASE_URL for Prisma during build
ENV DATABASE_URL="file:./dev.db"

# Gerar o Prisma Client e aplicar migrações locais no SQLite
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run prisma:seed

# Compilar a aplicação de TypeScript para JavaScript
RUN npm run build

# Limpar devDependencies para economizar espaço
RUN npm prune --production

# ==========================================
# Estágio 2: Runner de Produção
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma on Alpine
RUN apk update && apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copiar apenas os arquivos necessários para rodar em produção
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docs ./docs
COPY .env.example ./.env

EXPOSE 3000

# Executa o servidor compilado
CMD ["node", "dist/server.js"]
