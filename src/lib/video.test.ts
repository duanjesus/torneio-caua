import assert from "node:assert/strict";
import { test } from "node:test";
import { analisarVideo, embedYoutube, rotuloLink } from "./video.ts";

test("reconhece os formatos de link do YouTube", () => {
  const id = "dQw4w9WgXcQ";
  for (const url of [
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/watch?v=${id}&t=10s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtube.com/shorts/${id}?feature=share`,
    `https://www.youtube.com/live/${id}`,
    `https://www.youtube.com/embed/${id}`,
  ]) {
    assert.deepEqual(analisarVideo(url), { tipo: "youtube", id }, url);
  }
});

test("arquivo de vídeo toca direto; outros links viram botão", () => {
  assert.deepEqual(analisarVideo("https://cdn.exemplo.com/lance.mp4"), { tipo: "arquivo", url: "https://cdn.exemplo.com/lance.mp4" });
  const lr = analisarVideo("https://www.lancereplay.com.br/replay/abc123");
  assert.equal(lr?.tipo, "link");
  assert.equal(lr?.tipo === "link" && rotuloLink(lr.host), "Assistir no Lance Replay");
});

test("recusa o que não é link https", () => {
  assert.equal(analisarVideo(""), null);
  assert.equal(analisarVideo("gol do pedro"), null);
  assert.equal(analisarVideo("javascript:alert(1)"), null);
  assert.equal(analisarVideo("http://youtu.be/dQw4w9WgXcQ"), null);
  assert.equal(analisarVideo("https://www.youtube.com/watch?v=curto"), null);
});

test("na TV o player toca sozinho, mudo e em loop", () => {
  const url = new URL(embedYoutube("dQw4w9WgXcQ", { tv: true }));
  assert.equal(url.hostname, "www.youtube-nocookie.com");
  assert.equal(url.searchParams.get("mute"), "1");
  assert.equal(url.searchParams.get("playlist"), "dQw4w9WgXcQ");
});
