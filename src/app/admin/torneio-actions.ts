"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CORES, MAX_TIMES, embaralhar, sortearTimes } from "@/lib/sorteio";
import { distribuirGrupos, montarTabela, validarConfig, type ConfigTabela } from "@/lib/tabela";
import { atualizarChave } from "@/lib/torneio";

export type Retorno = { ok: true } | { ok: false; erro: string };

function revalidar() {
  revalidatePath("/admin", "layout");
  revalidatePath("/torneio");
}

const falha = (erro: string): Retorno => ({ ok: false, erro });

// ---------- Times ----------

/** Sorteia os times com os jogadores confirmados. Apaga times e tabela anteriores. */
export async function sortearTimesAcao(numTimes: number): Promise<Retorno> {
  await requireAdmin();
  if (!Number.isInteger(numTimes) || numTimes < 2 || numTimes > MAX_TIMES) return falha(`De 2 a ${MAX_TIMES} times.`);

  const jogadores = await db.crianca.findMany({
    where: { joga: true, resposta: { presenca: "SIM" } },
    select: { id: true, idade: true, nivel: true, goleiro: true },
  });
  if (jogadores.length < numTimes) return falha(`Só há ${jogadores.length} jogadores confirmados para ${numTimes} times.`);

  const divisao = sortearTimes(jogadores, numTimes);
  const cores = CORES.slice(0, numTimes);

  await db.$transaction(async (tx) => {
    await tx.jogo.deleteMany();
    await tx.time.deleteMany();
    for (const [i, ids] of divisao.entries()) {
      const time = await tx.time.create({
        data: { nome: `Time ${cores[i].nome}`, cor: cores[i].hex, ordem: i },
      });
      await tx.crianca.updateMany({ where: { id: { in: ids } }, data: { timeId: time.id } });
    }
  });
  revalidar();
  return { ok: true };
}

export async function salvarTime(id: number, dados: { nome: string; cor: string }): Promise<Retorno> {
  await requireAdmin();
  const nome = dados.nome.replace(/\s+/g, " ").trim();
  if (nome.length < 2 || nome.length > 30) return falha("Nome do time com 2 a 30 letras.");
  if (!CORES.some((c) => c.hex === dados.cor)) return falha("Cor inválida.");
  await db.time.update({ where: { id }, data: { nome, cor: dados.cor } });
  revalidar();
  return { ok: true };
}

/** Coloca um jogador num time (ou tira de todos, com `timeId` nulo). */
export async function moverJogador(criancaId: number, timeId: number | null): Promise<Retorno> {
  await requireAdmin();
  if (timeId !== null && !(await db.time.count({ where: { id: timeId } }))) return falha("Time não existe mais.");
  await db.crianca.update({ where: { id: criancaId }, data: { timeId, ...(timeId !== null && { joga: true }) } });
  revalidar();
  return { ok: true };
}

// ---------- Tabela ----------

export async function gerarTabela(cfg: ConfigTabela): Promise<Retorno> {
  await requireAdmin();
  const times = await db.time.findMany({ orderBy: { ordem: "asc" }, select: { id: true } });
  const config: ConfigTabela = {
    formato: cfg.formato === "MATA" ? "MATA" : "GRUPOS",
    numGrupos: Number(cfg.numGrupos),
    classificados: Number(cfg.classificados),
    terceiroLugar: Boolean(cfg.terceiroLugar),
    campos: Number(cfg.campos),
    duracao: Number(cfg.duracao),
    intervalo: Number(cfg.intervalo),
    inicio: String(cfg.inicio),
  };
  const erro = validarConfig(config, times.length);
  if (erro) return falha(erro);

  const ordem = embaralhar(times.map((t) => t.id));
  const grupos = config.formato === "GRUPOS" ? distribuirGrupos(ordem, config.numGrupos) : undefined;
  const { jogos } = montarTabela(config, grupos ? { grupos } : { timesMata: ordem });
  const fixo = (fonte: string) => (/^T:(\d+)$/.exec(fonte) ? Number(fonte.slice(2)) : null);

  await db.$transaction(async (tx) => {
    await tx.jogo.deleteMany();
    await tx.time.updateMany({ data: { grupo: null } });
    for (const [g, ids] of Object.entries(grupos ?? {})) {
      await tx.time.updateMany({ where: { id: { in: ids } }, data: { grupo: g } });
    }
    await tx.jogo.createMany({
      data: jogos.map((j) => ({ ...j, timeAId: fixo(j.fonteA), timeBId: fixo(j.fonteB) })),
    });
    await tx.torneio.upsert({ where: { id: 1 }, create: { id: 1, ...config }, update: config });
  });
  revalidar();
  return { ok: true };
}

export async function apagarTabela(): Promise<Retorno> {
  await requireAdmin();
  await db.$transaction([db.jogo.deleteMany(), db.time.updateMany({ data: { grupo: null } })]);
  revalidar();
  return { ok: true };
}

export async function publicar(publicado: boolean): Promise<Retorno> {
  await requireAdmin();
  await db.torneio.upsert({ where: { id: 1 }, create: { id: 1, publicado }, update: { publicado } });
  revalidar();
  return { ok: true };
}

// ---------- Jogos ----------

async function jogo(id: number) {
  return db.jogo.findUnique({ where: { id }, include: { gols: true } });
}

export async function iniciarJogo(id: number): Promise<Retorno> {
  await requireAdmin();
  const j = await jogo(id);
  if (!j) return falha("Jogo não encontrado.");
  if (j.status !== "AGENDADO") return falha("Esse jogo já começou.");
  if (!j.timeAId || !j.timeBId) return falha("Os dois times ainda não estão definidos.");
  await db.jogo.update({ where: { id }, data: { status: "AO_VIVO", iniciadoEm: new Date() } });
  revalidar();
  return { ok: true };
}

export async function marcarGol(
  jogoId: number,
  dados: { timeId: number; criancaId: number | null; contra: boolean },
): Promise<Retorno> {
  await requireAdmin();
  const j = await jogo(jogoId);
  if (!j) return falha("Jogo não encontrado.");
  if (j.status !== "AO_VIVO") return falha("Só dá para marcar gol com o jogo rolando.");
  if (dados.timeId !== j.timeAId && dados.timeId !== j.timeBId) return falha("Esse time não está no jogo.");
  await db.gol.create({
    data: { jogoId, timeId: dados.timeId, criancaId: dados.criancaId, contra: dados.contra },
  });
  revalidar();
  return { ok: true };
}

export async function desfazerGol(golId: number): Promise<Retorno> {
  await requireAdmin();
  const gol = await db.gol.findUnique({ where: { id: golId }, include: { jogo: { select: { status: true } } } });
  if (!gol) return { ok: true };
  if (gol.jogo.status !== "AO_VIVO") return falha("Reabra o jogo para mexer no placar.");
  await db.gol.delete({ where: { id: golId } });
  revalidar();
  return { ok: true };
}

export async function encerrarJogo(id: number, penaltis: { a: number | null; b: number | null }): Promise<Retorno> {
  await requireAdmin();
  const j = await jogo(id);
  if (!j) return falha("Jogo não encontrado.");
  if (j.status !== "AO_VIVO") return falha("Esse jogo não está rolando.");

  const golsA = j.gols.filter((g) => g.timeId === j.timeAId).length;
  const golsB = j.gols.filter((g) => g.timeId === j.timeBId).length;
  let penaltisA: number | null = null;
  let penaltisB: number | null = null;
  if (j.fase !== "GRUPOS" && golsA === golsB) {
    const ok = (n: number | null) => Number.isInteger(n) && n! >= 0 && n! <= 30;
    if (!ok(penaltis.a) || !ok(penaltis.b)) return falha("Empate no mata-mata: informe os pênaltis.");
    if (penaltis.a === penaltis.b) return falha("Os pênaltis não podem terminar empatados.");
    penaltisA = penaltis.a;
    penaltisB = penaltis.b;
  }
  await db.jogo.update({
    where: { id },
    data: { status: "ENCERRADO", encerradoEm: new Date(), penaltisA, penaltisB },
  });
  await atualizarChave();
  revalidar();
  return { ok: true };
}

/** Volta um jogo encerrado para "ao vivo", para corrigir o placar. */
export async function reabrirJogo(id: number): Promise<Retorno> {
  await requireAdmin();
  const j = await jogo(id);
  if (!j) return falha("Jogo não encontrado.");
  if (j.status !== "ENCERRADO") return { ok: true };
  await db.jogo.update({ where: { id }, data: { status: "AO_VIVO", encerradoEm: null, penaltisA: null, penaltisB: null } });
  await atualizarChave();
  revalidar();
  return { ok: true };
}

/** Desfaz o "iniciar" de um jogo sem gols (clicou sem querer). */
export async function voltarParaAgendado(id: number): Promise<Retorno> {
  await requireAdmin();
  const j = await jogo(id);
  if (!j || j.status !== "AO_VIVO") return { ok: true };
  if (j.gols.length > 0) return falha("O jogo já tem gols; desfaça-os antes.");
  await db.jogo.update({ where: { id }, data: { status: "AGENDADO", iniciadoEm: null } });
  await atualizarChave();
  revalidar();
  return { ok: true };
}
