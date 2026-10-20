import assert from "node:assert/strict";
import { test } from "node:test";
import { campeao, classificar, resolverChave, resultado, type JogoEstado } from "./campeonato.ts";
import {
  distribuirGrupos,
  montarTabela,
  ordemChave,
  rodizio,
  rotuloFonte,
  validarConfig,
  type ConfigTabela,
} from "./tabela.ts";

const base: ConfigTabela = {
  formato: "GRUPOS",
  numGrupos: 2,
  classificados: 2,
  terceiroLugar: true,
  campos: 1,
  duracao: 12,
  intervalo: 3,
  inicio: "11:30",
};

const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

test("rodízio: todos se enfrentam uma vez, ninguém joga duas vezes na rodada", () => {
  for (const n of [3, 4, 5, 6]) {
    const rodadas = rodizio(ids(n));
    const confrontos = rodadas.flat().map(([a, b]) => [a, b].sort().join("x"));
    assert.equal(confrontos.length, (n * (n - 1)) / 2);
    assert.equal(new Set(confrontos).size, confrontos.length);
    for (const r of rodadas) {
      const times = r.flat();
      assert.equal(new Set(times).size, times.length);
    }
  }
});

test("ordem da chave separa os cabeças 1 e 2", () => {
  assert.deepEqual(ordemChave(4), [1, 4, 2, 3]);
  assert.deepEqual(ordemChave(8), [1, 8, 4, 5, 2, 7, 3, 6]);
});

test("validação da configuração", () => {
  assert.equal(validarConfig(base, 8), null);
  assert.match(validarConfig({ ...base, numGrupos: 4 }, 6)!, /grupos/);
  assert.match(validarConfig({ ...base, classificados: 4 }, 6)!, /só 3/);
  assert.match(validarConfig({ ...base, numGrupos: 2, classificados: 0 }, 8)!, /classificar/);
  assert.equal(validarConfig({ ...base, numGrupos: 1, classificados: 0 }, 5), null);
  assert.match(validarConfig({ ...base, inicio: "25:00" }, 8)!, /início/);
  assert.equal(validarConfig({ ...base, formato: "MATA" }, 6), null);
});

test("2 grupos de 4 + semifinal, 3º lugar e final: 16 jogos em ordem", () => {
  const grupos = distribuirGrupos(ids(8), 2);
  const { jogos, termino } = montarTabela(base, { grupos });
  assert.equal(jogos.length, 12 + 2 + 1 + 1);
  assert.deepEqual(
    jogos.map((j) => j.numero),
    ids(16),
  );
  const semis = jogos.filter((j) => j.fase === "SEMI");
  assert.deepEqual(semis.map((s) => [s.fonteA, s.fonteB]), [
    ["G:A:1", "G:B:2"],
    ["G:B:1", "G:A:2"],
  ]);
  const terceiro = jogos.find((j) => j.fase === "TERCEIRO")!;
  const final = jogos.find((j) => j.fase === "FINAL")!;
  assert.deepEqual([terceiro.fonteA, terceiro.fonteB], semis.map((s) => `D:${s.numero}`));
  assert.deepEqual([final.fonteA, final.fonteB], semis.map((s) => `V:${s.numero}`));
  assert.ok(final.numero > terceiro.numero);
  // 1 campo, 15 min por jogo: 16 jogos de 11:30 terminam 15:27
  assert.equal(jogos[0].horario, "11:30");
  assert.equal(final.horario, "15:15");
  assert.equal(termino, "15:27");
});

test("com 2 campos, nenhum time joga dois jogos no mesmo horário", () => {
  const grupos = distribuirGrupos(ids(8), 2);
  const { jogos } = montarTabela({ ...base, campos: 2 }, { grupos });
  const porHorario = new Map<string, string[]>();
  for (const j of jogos) porHorario.set(j.horario, [...(porHorario.get(j.horario) ?? []), j.fonteA, j.fonteB]);
  for (const [h, fontes] of porHorario) assert.equal(new Set(fontes).size, fontes.length, `conflito às ${h}`);
});

test("mata-mata com 6 times: os 2 primeiros folgam na 1ª rodada", () => {
  const { jogos } = montarTabela({ ...base, formato: "MATA", terceiroLugar: false }, { timesMata: ids(6) });
  const quartas = jogos.filter((j) => j.fase === "QUARTAS");
  assert.equal(quartas.length, 2);
  const semis = jogos.filter((j) => j.fase === "SEMI");
  assert.deepEqual(semis.map((s) => s.fonteA).sort(), ["T:1", "T:2"]);
  assert.equal(jogos.filter((j) => j.fase === "FINAL").length, 1);
  assert.equal(jogos.length, 5);
});

test("pontos corridos: um grupo só, sem mata-mata", () => {
  const { jogos } = montarTabela({ ...base, numGrupos: 1, classificados: 0 }, { grupos: distribuirGrupos(ids(5), 1) });
  assert.equal(jogos.length, 10);
  assert.ok(jogos.every((j) => j.fase === "GRUPOS"));
});

test("rótulos das fontes", () => {
  assert.equal(rotuloFonte("G:A:1"), "1º do Grupo A");
  assert.equal(rotuloFonte("V:13"), "Vencedor do Jogo 13");
  assert.equal(rotuloFonte("D:14"), "Perdedor do Jogo 14");
});

// --- classificação e chave ---

function jogo(numero: number, a: number, b: number, ga: number, gb: number, grupo = "A"): JogoEstado {
  return {
    numero,
    fase: "GRUPOS",
    grupo,
    fonteA: `T:${a}`,
    fonteB: `T:${b}`,
    timeAId: a,
    timeBId: b,
    golsA: ga,
    golsB: gb,
    penaltisA: null,
    penaltisB: null,
    status: "ENCERRADO",
  };
}

test("classificação por pontos, saldo e gols", () => {
  const tabela = classificar([1, 2, 3], [jogo(1, 1, 2, 2, 0), jogo(2, 2, 3, 1, 1), jogo(3, 3, 1, 3, 1)]);
  // 1: V D = 3 pts, sg 0 · 3: E V = 4 pts · 2: D E = 1 pt
  assert.deepEqual(tabela.map((l) => [l.timeId, l.pts]), [
    [3, 4],
    [1, 3],
    [2, 1],
  ]);
  assert.equal(tabela[0].sg, 2);
});

test("empate em tudo: confronto direto desempata", () => {
  // 1 e 2 fazem 6 pontos, 2 vitórias, 3 gols pró e saldo +2; o 2 venceu o 1.
  const jogos = [jogo(1, 1, 2, 0, 1), jogo(2, 1, 3, 2, 0), jogo(3, 1, 4, 1, 0), jogo(4, 2, 3, 0, 1), jogo(5, 2, 4, 2, 0), jogo(6, 3, 4, 0, 0)];
  const t = classificar([1, 2, 3, 4], jogos);
  assert.deepEqual(t.map((l) => l.timeId), [2, 1, 3, 4]);
});

test("pênaltis decidem empate no mata-mata", () => {
  const j: JogoEstado = { ...jogo(9, 5, 6, 1, 1), fase: "FINAL", grupo: null };
  assert.equal(resultado(j), null);
  assert.deepEqual(resultado({ ...j, penaltisA: 3, penaltisB: 4 }), { vencedor: 6, perdedor: 5 });
});

test("chave se preenche quando o grupo termina e quando a semi acaba", () => {
  const grupos = { A: [1, 2], B: [3, 4] };
  const semi = (numero: number, fa: string, fb: string): JogoEstado => ({
    numero,
    fase: "SEMI",
    grupo: null,
    fonteA: fa,
    fonteB: fb,
    timeAId: null,
    timeBId: null,
    golsA: 0,
    golsB: 0,
    penaltisA: null,
    penaltisB: null,
    status: "AGENDADO",
  });
  const jogos: JogoEstado[] = [
    jogo(1, 1, 2, 3, 0, "A"),
    { ...jogo(2, 3, 4, 0, 0, "B"), status: "AO_VIVO" },
    semi(3, "G:A:1", "G:B:2"),
    semi(4, "G:B:1", "G:A:2"),
    { ...semi(5, "V:3", "V:4"), fase: "FINAL" },
  ];

  // Só o grupo A terminou
  assert.deepEqual(resolverChave(jogos, grupos), [
    { numero: 3, timeAId: 1, timeBId: null },
    { numero: 4, timeAId: null, timeBId: 2 },
  ]);

  // Grupo B termina 2 x 1 para o 4; semis jogadas
  jogos[1] = jogo(2, 3, 4, 1, 2, "B");
  jogos[2] = { ...jogos[2], timeAId: 1, timeBId: 3, golsA: 2, golsB: 1, status: "ENCERRADO" };
  jogos[3] = { ...jogos[3], timeAId: 4, timeBId: 2, golsA: 0, golsB: 0, penaltisA: 2, penaltisB: 3, status: "ENCERRADO" };
  assert.deepEqual(resolverChave(jogos, grupos), [{ numero: 5, timeAId: 1, timeBId: 2 }]);

  jogos[4] = { ...jogos[4], timeAId: 1, timeBId: 2, golsA: 0, golsB: 1, status: "ENCERRADO" };
  assert.equal(campeao(jogos, grupos), 2);
});

test("jogo já iniciado não troca de time quando um placar anterior é corrigido", () => {
  const jogos: JogoEstado[] = [
    jogo(1, 1, 2, 1, 0),
    {
      numero: 2,
      fase: "FINAL",
      grupo: null,
      fonteA: "V:1",
      fonteB: "T:3",
      timeAId: 2,
      timeBId: 3,
      golsA: 0,
      golsB: 0,
      penaltisA: null,
      penaltisB: null,
      status: "AO_VIVO",
    },
  ];
  assert.deepEqual(resolverChave(jogos, {}), []);
});
