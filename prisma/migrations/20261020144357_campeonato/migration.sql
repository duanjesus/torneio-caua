-- CreateEnum
CREATE TYPE "Formato" AS ENUM ('GRUPOS', 'MATA');

-- CreateEnum
CREATE TYPE "Fase" AS ENUM ('GRUPOS', 'OITAVAS', 'QUARTAS', 'SEMI', 'TERCEIRO', 'FINAL');

-- CreateEnum
CREATE TYPE "StatusJogo" AS ENUM ('AGENDADO', 'AO_VIVO', 'ENCERRADO');

-- AlterTable
ALTER TABLE "Crianca" ADD COLUMN     "timeId" INTEGER;

-- CreateTable
CREATE TABLE "Torneio" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "formato" "Formato" NOT NULL DEFAULT 'GRUPOS',
    "numGrupos" INTEGER NOT NULL DEFAULT 2,
    "classificados" INTEGER NOT NULL DEFAULT 2,
    "terceiroLugar" BOOLEAN NOT NULL DEFAULT true,
    "campos" INTEGER NOT NULL DEFAULT 1,
    "duracao" INTEGER NOT NULL DEFAULT 12,
    "intervalo" INTEGER NOT NULL DEFAULT 3,
    "inicio" TEXT NOT NULL DEFAULT '11:30',
    "publicado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Torneio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Time" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "grupo" TEXT,

    CONSTRAINT "Time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "fase" "Fase" NOT NULL,
    "grupo" TEXT,
    "rodada" INTEGER NOT NULL DEFAULT 1,
    "campo" INTEGER NOT NULL DEFAULT 1,
    "horario" TEXT NOT NULL,
    "fonteA" TEXT,
    "fonteB" TEXT,
    "timeAId" INTEGER,
    "timeBId" INTEGER,
    "penaltisA" INTEGER,
    "penaltisB" INTEGER,
    "status" "StatusJogo" NOT NULL DEFAULT 'AGENDADO',
    "iniciadoEm" TIMESTAMP(3),
    "encerradoEm" TIMESTAMP(3),

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gol" (
    "id" SERIAL NOT NULL,
    "jogoId" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,
    "criancaId" INTEGER,
    "contra" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jogo_numero_key" ON "Jogo"("numero");

-- CreateIndex
CREATE INDEX "Gol_jogoId_idx" ON "Gol"("jogoId");

-- CreateIndex
CREATE INDEX "Crianca_timeId_idx" ON "Crianca"("timeId");

-- AddForeignKey
ALTER TABLE "Crianca" ADD CONSTRAINT "Crianca_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_timeAId_fkey" FOREIGN KEY ("timeAId") REFERENCES "Time"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_timeBId_fkey" FOREIGN KEY ("timeBId") REFERENCES "Time"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gol" ADD CONSTRAINT "Gol_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gol" ADD CONSTRAINT "Gol_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "Time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gol" ADD CONSTRAINT "Gol_criancaId_fkey" FOREIGN KEY ("criancaId") REFERENCES "Crianca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
