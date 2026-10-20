-- CreateEnum
CREATE TYPE "Presenca" AS ENUM ('SIM', 'NAO', 'TALVEZ');

-- CreateTable
CREATE TABLE "Resposta" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "presenca" "Presenca" NOT NULL,
    "adultos" INTEGER NOT NULL DEFAULT 0,
    "recado" TEXT,
    "criadoPeloAdmin" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crianca" (
    "id" SERIAL NOT NULL,
    "respostaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "joga" BOOLEAN NOT NULL DEFAULT false,
    "goleiro" BOOLEAN NOT NULL DEFAULT false,
    "nivel" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Crianca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resposta_token_key" ON "Resposta"("token");

-- CreateIndex
CREATE INDEX "Crianca_respostaId_idx" ON "Crianca"("respostaId");

-- AddForeignKey
ALTER TABLE "Crianca" ADD CONSTRAINT "Crianca_respostaId_fkey" FOREIGN KEY ("respostaId") REFERENCES "Resposta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
