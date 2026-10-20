import assert from "node:assert/strict";
import { test } from "node:test";
import { tipoDaImagem } from "./fotos.ts";

test("reconhece imagem pelos primeiros bytes, não pelo nome", () => {
  assert.equal(tipoDaImagem(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "jpg");
  assert.equal(tipoDaImagem(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])), "png");
  const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
  assert.equal(tipoDaImagem(webp), "webp");
  assert.equal(tipoDaImagem(new TextEncoder().encode("<script>alert(1)</script>")), null);
  assert.equal(tipoDaImagem(new TextEncoder().encode("%PDF-1.7")), null);
});
