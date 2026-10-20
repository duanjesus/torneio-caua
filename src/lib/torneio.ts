import { campeao, classificar, resolverChave, type JogoEstado, type LinhaClassificacao } from "./campeonato";
import { db } from "./db";

export async function configTorneio() {
  return db.torneio.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

const incluirJogo = {
  gols: {
    orderBy: { criadoEm: "asc" as const },
    include: { crianca: { select: { id: true, nome: true, foto: true } } },
  },
};

type JogoComGols = Awaited<ReturnType<typeof buscarJogos>>[number];

function buscarJogos() {
  return db.jogo.findMany({ orderBy: { numero: "asc" }, include: incluirJogo });
}

/** Placar sai dos gols registrados: assim placar e artilharia nunca se desencontram. */
function comPlacar(j: JogoComGols) {
  return {
    ...j,
    golsA: j.gols.filter((g) => g.timeId === j.timeAId).length,
    golsB: j.gols.filter((g) => g.timeId === j.timeBId).length,
  };
}

export type JogoCompleto = ReturnType<typeof comPlacar>;

function gruposDosTimes(times: { id: number; grupo: string | null }[]): Record<string, number[]> {
  const grupos: Record<string, number[]> = {};
  for (const t of times) if (t.grupo) (grupos[t.grupo] ??= []).push(t.id);
  return grupos;
}

/** Tudo que as páginas do campeonato mostram, já calculado. */
export async function carregarTorneio() {
  const [config, times, jogosDb] = await Promise.all([
    configTorneio(),
    db.time.findMany({
      orderBy: { ordem: "asc" },
      include: {
        jogadores: {
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, idade: true, goleiro: true, nivel: true, foto: true },
        },
      },
    }),
    buscarJogos(),
  ]);

  const jogos = jogosDb.map(comPlacar);
  const grupos = gruposDosTimes(times);
  const classificacao: Record<string, LinhaClassificacao[]> = {};
  for (const [g, ids] of Object.entries(grupos).sort()) {
    classificacao[g] = classificar(
      ids,
      jogos.filter((j) => j.fase === "GRUPOS" && j.grupo === g),
    );
  }

  const artilheiros = new Map<number, { criancaId: number; nome: string; timeId: number; gols: number }>();
  for (const j of jogos) {
    for (const g of j.gols) {
      if (g.contra || !g.crianca) continue;
      const atual = artilheiros.get(g.crianca.id) ?? { criancaId: g.crianca.id, nome: g.crianca.nome, timeId: g.timeId, gols: 0 };
      atual.gols++;
      artilheiros.set(g.crianca.id, atual);
    }
  }
  const artilharia = [...artilheiros.values()].sort((a, b) => b.gols - a.gols || a.nome.localeCompare(b.nome));

  return {
    config,
    times,
    timePorId: new Map(times.map((t) => [t.id, t])),
    jogos,
    grupos,
    classificacao,
    artilharia,
    campeaoId: campeao(jogos, grupos),
  };
}

export type DadosTorneio = Awaited<ReturnType<typeof carregarTorneio>>;
export type TimeCompleto = DadosTorneio["times"][number];

/** Recalcula quem joga cada partida do mata-mata. Chamar depois de qualquer mudança de placar. */
export async function atualizarChave(): Promise<void> {
  const [times, jogosDb] = await Promise.all([
    db.time.findMany({ select: { id: true, grupo: true }, orderBy: { ordem: "asc" } }),
    buscarJogos(),
  ]);
  const estados: JogoEstado[] = jogosDb.map(comPlacar);
  const mudancas = resolverChave(estados, gruposDosTimes(times));
  if (mudancas.length === 0) return;
  await db.$transaction(
    mudancas.map((m) =>
      db.jogo.update({ where: { numero: m.numero }, data: { timeAId: m.timeAId, timeBId: m.timeBId } }),
    ),
  );
}
