import { PrismaClient } from "@prisma/client";

// Comandos da Vercel (env pull, blob, integration) gravam o banco de produção no .env.local,
// que o Next lê antes do .env. Em desenvolvimento, recusa qualquer banco que não seja local.
if (
  process.env.NODE_ENV === "development" &&
  !/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "") &&
  !process.env.PERMITIR_BANCO_REMOTO
) {
  throw new Error(
    "DATABASE_URL não é local em desenvolvimento (veio do .env.local da Vercel?). " +
      "Apague o .env.local ou defina PERMITIR_BANCO_REMOTO=1 se for de propósito.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
