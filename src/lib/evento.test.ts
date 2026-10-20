import assert from "node:assert/strict";
import { test } from "node:test";
import { mensagemConvite, prazoEncerrado } from "./evento.ts";

test("prazo vale até o fim do dia 30/10 no horário de Brasília", () => {
  assert.equal(prazoEncerrado(new Date("2026-10-30T23:59:00-03:00")), false);
  // 30/10 às 23h30 em Brasília já é 31/10 em UTC: ainda está no prazo
  assert.equal(prazoEncerrado(new Date("2026-10-31T02:30:00Z")), false);
  assert.equal(prazoEncerrado(new Date("2026-10-31T00:00:00-03:00")), true);
});

test("a mensagem do convite fala do prazo", () => {
  assert.match(mensagemConvite(), /Confirme até sexta, 30\/10/);
});
