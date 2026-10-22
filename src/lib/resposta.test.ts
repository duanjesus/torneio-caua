import assert from "node:assert/strict";
import { test } from "node:test";
import { formatarTelefone, nomePublico, normalizarTelefone, validarResposta } from "./resposta.ts";

const base = {
  responsavel: "  Maria   Silva ",
  telefone: "(21) 99876-5432",
  presenca: "SIM",
  adultos: 2,
  recado: "",
  criancas: [{ nome: "João", idade: "8", joga: true, goleiro: true }],
};

test("aceita uma resposta completa e normaliza os campos", () => {
  const r = validarResposta(base);
  assert.ok(r.ok);
  assert.equal(r.valor.responsavel, "Maria Silva");
  assert.equal(r.valor.telefone, "21998765432");
  assert.deepEqual(r.valor.criancas, [{ nome: "João", idade: 8, joga: true, goleiro: true, foto: null }]);
});

test("telefone com +55 perde o código do país", () => {
  assert.equal(normalizarTelefone("+55 21 99876-5432"), "21998765432");
  assert.equal(normalizarTelefone("2133334444"), "2133334444");
  assert.equal(formatarTelefone("21998765432"), "(21) 99876-5432");
});

test("exige telefone do convidado, mas não do admin", () => {
  const semTel = { ...base, telefone: "" };
  const r = validarResposta(semTel);
  assert.ok(!r.ok);
  assert.ok(r.erros.telefone);
  assert.ok(validarResposta(semTel, { exigirTelefone: false }).ok);
});

test("quem não vem não fica inscrito no torneio", () => {
  const r = validarResposta({ ...base, presenca: "NAO", adultos: 0 });
  assert.ok(r.ok);
  assert.equal(r.valor.criancas[0].joga, false);
  assert.equal(r.valor.criancas[0].goleiro, false);
});

test("goleiro só vale para quem joga", () => {
  const r = validarResposta({ ...base, criancas: [{ nome: "Bia", idade: 7, joga: false, goleiro: true }] });
  assert.ok(r.ok);
  assert.equal(r.valor.criancas[0].goleiro, false);
});

test("aponta o erro de cada criança pelo índice", () => {
  const r = validarResposta({ ...base, criancas: [{ nome: "Lu", idade: 7 }, { nome: "", idade: 40 }] });
  assert.ok(!r.ok);
  assert.ok(r.erros["criancas.1.nome"]);
  assert.ok(r.erros["criancas.1.idade"]);
  assert.equal(r.erros["criancas.0.nome"], undefined);
});

test("confirmar presença sem ninguém vindo é erro", () => {
  const r = validarResposta({ ...base, adultos: 0, criancas: [] });
  assert.ok(!r.ok);
  assert.ok(r.erros.adultos);
});

test("preserva o id da criança na edição e ignora id inválido", () => {
  const r = validarResposta({
    ...base,
    criancas: [
      { id: 7, nome: "Theo", idade: 8, joga: true },
      { id: "abc", nome: "Davi", idade: 9, joga: false },
    ],
  });
  assert.ok(r.ok);
  assert.equal(r.valor.criancas[0].id, 7);
  assert.equal("id" in r.valor.criancas[1], false);
});

test("presença inválida e lixo na entrada não quebram", () => {
  const r = validarResposta(null);
  assert.ok(!r.ok);
  assert.ok(r.erros.presenca);
  assert.ok(r.erros.responsavel);
});

test("nome público abrevia o sobrenome", () => {
  assert.equal(nomePublico("Cauã"), "Cauã");
  assert.equal(nomePublico("Cauã Jesus"), "Cauã J.");
  assert.equal(nomePublico("Ana Paula de Souza"), "Ana Paula S.");
});

test("criança de quem vem precisa da escolha: jogar ou só a festa", () => {
  const sem = validarResposta({ ...base, criancas: [{ nome: "Bia", idade: 5 }] });
  assert.ok(!sem.ok);
  assert.ok(sem.erros["criancas.0.joga"]);
  const soFesta = validarResposta({ ...base, criancas: [{ nome: "Bia", idade: 5, joga: false }] });
  assert.ok(soFesta.ok);
  assert.equal(soFesta.valor.criancas[0].joga, false);
  // Quem não vem não precisa escolher
  assert.ok(validarResposta({ ...base, presenca: "NAO", adultos: 0, criancas: [{ nome: "Bia", idade: 5 }] }).ok);
});
