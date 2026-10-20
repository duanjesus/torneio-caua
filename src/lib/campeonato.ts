// Classificação dos grupos, vencedores e preenchimento da chave. Puro, para dar para testar.

import type { Fase } from "./tabela.ts";

export type JogoEstado = {
  numero: number;
  fase: Fase;
  grupo: string | null;
  fonteA: string | null;
  fonteB: string | null;
  timeAId: number | null;
  timeBId: number | null;
  golsA: number;
  golsB: number;
  penaltisA: number | null;
  penaltisB: number | null;
  status: "AGENDADO" | "AO_VIVO" | "ENCERRADO";
};

export type LinhaClassificacao = {
  timeId: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  pts: number;
};

/**
 * Tabela de um grupo pelos jogos encerrados. Critérios: pontos, vitórias, saldo, gols pró,
 * confronto direto (entre dois empatados) e, por fim, a ordem de `timeIds`.
 */
export function classificar(timeIds: readonly number[], jogos: readonly JogoEstado[]): LinhaClassificacao[] {
  const linhas = new Map<number, LinhaClassificacao>(
    timeIds.map((id) => [id, { timeId: id, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 }]),
  );
  const encerrados = jogos.filter(
    (j) => j.status === "ENCERRADO" && j.timeAId !== null && j.timeBId !== null && linhas.has(j.timeAId) && linhas.has(j.timeBId),
  );
  for (const jogo of encerrados) {
    const a = linhas.get(jogo.timeAId!)!;
    const b = linhas.get(jogo.timeBId!)!;
    a.j++;
    b.j++;
    a.gp += jogo.golsA;
    a.gc += jogo.golsB;
    b.gp += jogo.golsB;
    b.gc += jogo.golsA;
    if (jogo.golsA > jogo.golsB) {
      a.v++;
      b.d++;
    } else if (jogo.golsA < jogo.golsB) {
      b.v++;
      a.d++;
    } else {
      a.e++;
      b.e++;
    }
  }
  for (const l of linhas.values()) {
    l.sg = l.gp - l.gc;
    l.pts = l.v * 3 + l.e;
  }

  const confrontoDireto = (x: number, y: number) => {
    let saldo = 0;
    for (const j of encerrados) {
      if (j.timeAId === x && j.timeBId === y) saldo += j.golsA - j.golsB;
      if (j.timeAId === y && j.timeBId === x) saldo += j.golsB - j.golsA;
    }
    return saldo;
  };
  const ordem = new Map(timeIds.map((id, i) => [id, i]));

  return [...linhas.values()].sort(
    (x, y) =>
      y.pts - x.pts ||
      y.v - x.v ||
      y.sg - x.sg ||
      y.gp - x.gp ||
      -confrontoDireto(x.timeId, y.timeId) ||
      ordem.get(x.timeId)! - ordem.get(y.timeId)!,
  );
}

/** Quem venceu e quem perdeu um jogo encerrado; null enquanto não dá para saber. */
export function resultado(j: JogoEstado): { vencedor: number; perdedor: number } | null {
  if (j.status !== "ENCERRADO" || j.timeAId === null || j.timeBId === null) return null;
  let aVence: boolean;
  if (j.golsA !== j.golsB) aVence = j.golsA > j.golsB;
  else if (j.penaltisA !== null && j.penaltisB !== null && j.penaltisA !== j.penaltisB) aVence = j.penaltisA > j.penaltisB;
  else return null;
  return aVence ? { vencedor: j.timeAId, perdedor: j.timeBId } : { vencedor: j.timeBId, perdedor: j.timeAId };
}

export function grupoEncerrado(grupo: string, jogos: readonly JogoEstado[]): boolean {
  const doGrupo = jogos.filter((j) => j.fase === "GRUPOS" && j.grupo === grupo);
  return doGrupo.length > 0 && doGrupo.every((j) => j.status === "ENCERRADO");
}

/**
 * Descobre os times de cada jogo do mata-mata a partir das fontes. Só mexe em jogos que ainda
 * não começaram: um jogo em andamento ou encerrado fica com os times que tinha.
 * Devolve apenas os jogos cujos times mudaram.
 */
export function resolverChave(
  jogos: readonly JogoEstado[],
  grupos: Record<string, readonly number[]>,
): { numero: number; timeAId: number | null; timeBId: number | null }[] {
  const porNumero = new Map(jogos.map((j) => [j.numero, { ...j }]));
  const classificacoes = new Map<string, LinhaClassificacao[] | null>();
  const posicao = (grupo: string, p: number) => {
    if (!classificacoes.has(grupo)) {
      const ids = grupos[grupo];
      classificacoes.set(grupo, ids && grupoEncerrado(grupo, jogos) ? classificar(ids, jogos) : null);
    }
    return classificacoes.get(grupo)?.[p - 1]?.timeId ?? null;
  };

  const resolver = (fonte: string | null): number | null => {
    if (!fonte) return null;
    let m = /^T:(\d+)$/.exec(fonte);
    if (m) return Number(m[1]);
    m = /^G:(\w+):(\d+)$/.exec(fonte);
    if (m) return posicao(m[1], Number(m[2]));
    m = /^([VD]):(\d+)$/.exec(fonte);
    if (m) {
      const origem = porNumero.get(Number(m[2]));
      const r = origem ? resultado(origem) : null;
      return r ? (m[1] === "V" ? r.vencedor : r.perdedor) : null;
    }
    return null;
  };

  const mudancas: { numero: number; timeAId: number | null; timeBId: number | null }[] = [];
  // As fontes sempre apontam para jogos de número menor; em ordem, cada jogo já vê os anteriores resolvidos.
  for (const j of [...porNumero.values()].sort((a, b) => a.numero - b.numero)) {
    if (j.fase === "GRUPOS" || j.status !== "AGENDADO") continue;
    const timeAId = resolver(j.fonteA);
    const timeBId = resolver(j.fonteB);
    if (timeAId !== j.timeAId || timeBId !== j.timeBId) {
      j.timeAId = timeAId;
      j.timeBId = timeBId;
      mudancas.push({ numero: j.numero, timeAId, timeBId });
    }
  }
  return mudancas;
}

/** Campeão: vencedor da final ou, sem mata-mata, o líder do grupo único quando acaba. */
export function campeao(jogos: readonly JogoEstado[], grupos: Record<string, readonly number[]>): number | null {
  const final = jogos.find((j) => j.fase === "FINAL");
  if (final) return resultado(final)?.vencedor ?? null;
  const nomes = Object.keys(grupos);
  if (nomes.length === 1 && grupoEncerrado(nomes[0], jogos)) return classificar(grupos[nomes[0]], jogos)[0]?.timeId ?? null;
  return null;
}
