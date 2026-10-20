-- CreateTable
CREATE TABLE "Lance" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "titulo" TEXT,
    "jogoId" INTEGER,
    "golId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lance_jogoId_idx" ON "Lance"("jogoId");

-- AddForeignKey
ALTER TABLE "Lance" ADD CONSTRAINT "Lance_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lance" ADD CONSTRAINT "Lance_golId_fkey" FOREIGN KEY ("golId") REFERENCES "Gol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
