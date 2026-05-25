-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "corbanId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Proposta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteNome" TEXT NOT NULL,
    "clienteCpf" TEXT NOT NULL,
    "clienteRenda" REAL NOT NULL,
    "valorSolicitado" REAL NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "taxaJuros" REAL NOT NULL,
    "valorParcela" REAL NOT NULL,
    "totalAPagar" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "motivoReprovacao" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Proposta_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
