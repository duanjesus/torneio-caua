-- AlterTable
ALTER TABLE "Resposta" ADD COLUMN     "acompanhantes" TEXT[] DEFAULT ARRAY[]::TEXT[];
