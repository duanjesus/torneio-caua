import assert from "node:assert/strict";
import { test } from "node:test";
import { formatarTelefone, nomesDosAdultos, nomePublico, normalizarTelefone, validarResposta } from "./resposta.ts";

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

test("adultos com nome: quem responde + acompanhantes", () => {
  const r = validarResposta({ ...base, adultos: undefined, euVou: true, acompanhantes: [" João  Silva ", "Ana"] });
  assert.ok(r.ok);
  assert.equal(r.valor.adultos, 3);
  assert.deepEqual(r.valor.acompanhantes, ["João Silva", "Ana"]);
  // quem responde pode não ir (só manda a avó com as crianças)
  const semMim = validarResposta({ ...base, adultos: undefined, euVou: false, acompanhantes: ["Vó Lúcia"] });
  assert.ok(semMim.ok);
  assert.equal(semMim.valor.adultos, 1);
});

test("acompanhante sem nome é erro no campo dele", () => {
  const r = validarResposta({ ...base, adultos: undefined, acompanhantes: ["Ana", " "] });
  assert.ok(!r.ok);
  assert.ok(r.erros["acompanhantes.1"]);
  assert.equal(r.erros["acompanhantes.0"], undefined);
});

test("quem não vai não conta adultos, mas guarda os nomes já digitados", () => {
  const r = validarResposta({ ...base, presenca: "NAO", adultos: undefined, acompanhantes: ["Ana", " "] });
  assert.ok(r.ok);
  assert.equal(r.valor.adultos, 0);
  assert.deepEqual(r.valor.acompanhantes, ["Ana"]);
});

test("ninguém vindo (sem eu, sem acompanhante, sem criança) é erro", () => {
  const r = validarResposta({ ...base, adultos: undefined, euVou: false, acompanhantes: [], criancas: [] });
  assert.ok(!r.ok);
  assert.ok(r.erros.adultos);
});

test("nomes dos adultos: quem respondeu + acompanhantes, e os sem nome de respostas antigas", () => {
  const r = { responsavel: "Mariana", presenca: "SIM" as const };
  assert.deepEqual(nomesDosAdultos({ ...r, adultos: 3, acompanhantes: ["João", "Vó Lúcia"] }), ["Mariana", "João", "Vó Lúcia"]);
  assert.deepEqual(nomesDosAdultos({ ...r, adultos: 1, acompanhantes: ["Vó Lúcia"] }), ["Vó Lúcia"]);
  assert.deepEqual(nomesDosAdultos({ ...r, adultos: 2, acompanhantes: [] }), ["Mariana", "adulto sem nome"]);
  assert.deepEqual(nomesDosAdultos({ ...r, presenca: "NAO", adultos: 0, acompanhantes: ["João"] }), []);
});
