import assert from "node:assert/strict";
import { test } from "node:test";
import { juntarNomes, mensagemTalvez, mensagemVespera, primeiroNome } from "./lembretes.ts";

const url = "https://torneio-caua.vercel.app";

test("juntar nomes como se fala", () => {
  assert.equal(juntarNomes(["Ana"]), "Ana");
  assert.equal(juntarNomes(["Ana", "Bia"]), "Ana e Bia");
  assert.equal(juntarNomes(["Ana", "Bia", "Caio"]), "Ana, Bia e Caio");
});

test("lembrete do talvez leva o link da própria resposta e o prazo", () => {
  const m = mensagemTalvez({ responsavel: "Mariana Souza", token: "abc123" }, url);
  assert.match(m, /^Oi, Mariana!/);
  assert.match(m, /sexta, 30\/10/);
  assert.ok(m.includes(`${url}/confirmar?t=abc123`));
});

test("véspera: com criança jogando fala do equipamento, sem criança não", () => {
  const com = mensagemVespera({ responsavel: "João", jogadores: ["Theo Lima", "Bia Lima"] }, url);
  assert.match(com, /Theo e Bia estão escalados/);
  assert.match(com, /chuteira, meião e caneleira/);
  const um = mensagemVespera({ responsavel: "João", jogadores: ["Theo Lima"] }, url);
  assert.match(um, /Theo está escalado/);
  const sem = mensagemVespera({ responsavel: "Avó Lúcia", jogadores: [] }, url);
  assert.doesNotMatch(sem, /chuteira/);
  assert.ok(sem.includes(`${url}/torneio`));
});

test("primeiro nome, mas família fica inteira", () => {
  assert.equal(primeiroNome("Mariana Souza"), "Mariana");
  assert.equal(primeiroNome("Família Souza"), "Família Souza");
  assert.equal(primeiroNome("familia lima"), "familia lima");
});
