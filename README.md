# Torneio do Cauã

Convite, confirmação de presença e campeonato da festa de 8 anos do Cauã.

- **Convidados**: abrem o link, confirmam quem vem e inscrevem as crianças que vão jogar.
- **Admin** (`/admin`): acompanha as respostas, organiza jogadores e (Fase 2) times, tabela e placares.

Plano e roteiro: [docs/PLANO.md](docs/PLANO.md).

## Rodar local

Precisa de Node 22+ e Docker.

```bash
cp .env.example .env        # troque ADMIN_PASSWORD e SESSION_SECRET
docker compose up -d        # Postgres em localhost:5442
npm install
npx prisma migrate deploy
npm run dev                 # http://localhost:3030
```

## Stack

Next.js 16 (App Router, server actions) · TypeScript · Prisma 6 · Postgres 17 · Tailwind 4.

## Testes

```bash
npm test
npm run typecheck
```
