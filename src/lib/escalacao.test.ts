import assert from "node:assert/strict";
import { test } from "node:test";
import { formacao, iniciais, montarEscalacao } from "./escalacao.ts";
import { nomeFotoValido } from "./resposta.ts";

test("formação por número de jogadores de linha", () => {
  assert.deepEqual(formacao(0), []);
  assert.deepEqual(formacao(3), [3]);
  assert.deepEqual(formacao(4), [2, 2]);
  assert.deepEqual(formacao(5), [3, 2]);
  assert.deepEqual(formacao(7), [3, 2, 2]);
  assert.deepEqual(formacao(10), [4, 3, 3]);
});

test("goleiro vai para o gol e o resto se espalha em fileiras", () => {
  const time = [
    { id: 1, goleiro: false },
    { id: 2, goleiro: true },
    { id: 3, goleiro: false },
    { id: 4, goleiro: true },
    { id: 5, goleiro: false },
    { id: 6, goleiro: false },
  ];
  const { goleiro, fileiras } = montarEscalacao(time);
  assert.equal(goleiro?.id, 2);
  // o segundo goleiro joga na linha
  assert.deepEqual(fileiras.map((f) => f.map((j) => j.id)), [[1, 3, 4], [5, 6]]);
});

test("sem goleiro marcado, o gol fica vazio", () => {
  const { goleiro, fileiras } = montarEscalacao([{ goleiro: false }, { goleiro: false }]);
  assert.equal(goleiro, null);
  assert.equal(fileiras.flat().length, 2);
});

test("iniciais", () => {
  assert.equal(iniciais("Cauã"), "C");
  assert.equal(iniciais("ana paula souza"), "AS");
});

test("nome de foto aceito só no formato que o servidor gera", () => {
  assert.ok(nomeFotoValido("k3J9aB-c_d8E2fGh1iJkLm0N.jpg"));
  assert.ok(!nomeFotoValido("../.env"));
  assert.ok(!nomeFotoValido("https://exemplo.com/foto.jpg"));
  assert.ok(!nomeFotoValido("abc.jpg"));
});
