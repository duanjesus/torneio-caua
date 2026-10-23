import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { lerSessao, montarSessao } from "./sessao.ts";

const SEGREDO = "segredo-de-teste-com-mais-de-16";
const daquiAUmaHora = Date.now() + 3_600_000;

test("lê o papel de uma sessão válida", () => {
  assert.equal(lerSessao(montarSessao("admin", daquiAUmaHora, SEGREDO), SEGREDO), "admin");
  assert.equal(lerSessao(montarSessao("leitor", daquiAUmaHora, SEGREDO), SEGREDO), "leitor");
});

test("leitor que troca o papel no cookie para admin perde a sessão", () => {
  const leitor = montarSessao("leitor", daquiAUmaHora, SEGREDO);
  const adulterado = leitor.replace(".leitor.", ".admin.");
  assert.equal(lerSessao(adulterado, SEGREDO), null);
});

test("sessão vencida, assinada com outro segredo ou malformada não vale", () => {
  assert.equal(lerSessao(montarSessao("admin", Date.now() - 1, SEGREDO), SEGREDO), null);
  assert.equal(lerSessao(montarSessao("admin", daquiAUmaHora, "outro-segredo-qualquer-123"), SEGREDO), null);
  assert.equal(lerSessao("lixo", SEGREDO), null);
  assert.equal(lerSessao(`${daquiAUmaHora}.dono.abc`, SEGREDO), null);
  assert.equal(lerSessao(undefined, SEGREDO), null);
});

test("cookie no formato antigo (de antes do leitor) continua valendo como admin", () => {
  const expira = String(daquiAUmaHora);
  const antigo = `${expira}.${createHmac("sha256", SEGREDO).update(expira).digest("hex")}`;
  assert.equal(lerSessao(antigo, SEGREDO), "admin");
});
