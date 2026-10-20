import assert from "node:assert/strict";
import { test } from "node:test";
import { forca, rngComSemente, sortearTimes, type JogadorSorteio } from "./sorteio.ts";

function elenco(n: number, goleiros = 0): JogadorSorteio[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    idade: 6 + (i % 4),
    nivel: (i % 3) + 1,
    goleiro: i < goleiros,
  }));
}

test("todo mundo entra em exatamente um time", () => {
  const jogadores = elenco(23, 3);
  const times = sortearTimes(jogadores, 4, rngComSemente(1));
  const ids = times.flat().sort((a, b) => a - b);
  assert.deepEqual(ids, jogadores.map((j) => j.id));
});

test("times com o mesmo tamanho, diferença máxima de 1", () => {
  for (const n of [8, 13, 20, 31]) {
    const tamanhos = sortearTimes(elenco(n, 2), 4, rngComSemente(n)).map((t) => t.length);
    assert.ok(Math.max(...tamanhos) - Math.min(...tamanhos) <= 1, `n=${n}: ${tamanhos}`);
  }
});

test("um goleiro por time quando há goleiros suficientes", () => {
  const jogadores = elenco(24, 4);
  const goleiros = new Set(jogadores.filter((j) => j.goleiro).map((j) => j.id));
  for (const time of sortearTimes(jogadores, 4, rngComSemente(7))) {
    assert.equal(time.filter((id) => goleiros.has(id)).length, 1);
  }
});

test("as forças dos times ficam próximas", () => {
  const jogadores = elenco(32, 4);
  const porId = new Map(jogadores.map((j) => [j.id, j]));
  for (let semente = 1; semente <= 20; semente++) {
    const somas = sortearTimes(jogadores, 4, rngComSemente(semente)).map((t) =>
      t.reduce((s, id) => s + forca(porId.get(id)!), 0),
    );
    // Um craque (nível 3, 9 anos) pesa 8,25; a diferença tem de ficar abaixo disso.
    assert.ok(Math.max(...somas) - Math.min(...somas) < 8, `semente ${semente}: ${somas}`);
  }
});

test("sementes diferentes dão sorteios diferentes", () => {
  const a = JSON.stringify(sortearTimes(elenco(16), 4, rngComSemente(1)));
  const b = JSON.stringify(sortearTimes(elenco(16), 4, rngComSemente(2)));
  assert.notEqual(a, b);
});

test("recusa menos de 2 times", () => {
  assert.throws(() => sortearTimes(elenco(5), 1));
});
