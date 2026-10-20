// Entende o link de um lance: YouTube vira player embutido, arquivo de vídeo toca direto
// e qualquer outro link (ex.: o compartilhar do Lance Replay) vira um botão para abrir. Puro.

export type Video =
  | { tipo: "youtube"; id: string }
  | { tipo: "arquivo"; url: string }
  | { tipo: "link"; url: string; host: string };

const ID_YOUTUBE = /^[\w-]{11}$/;
const HOSTS_YOUTUBE = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);

export function analisarVideo(entrada: string): Video | null {
  const texto = entrada.trim();
  if (texto.length === 0 || texto.length > 500) return null;
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return ID_YOUTUBE.test(id) ? { tipo: "youtube", id } : null;
  }
  if (HOSTS_YOUTUBE.has(host)) {
    const v = url.searchParams.get("v");
    if (v && ID_YOUTUBE.test(v)) return { tipo: "youtube", id: v };
    const m = /^\/(?:shorts|embed|live|v)\/([\w-]{11})/.exec(url.pathname);
    return m ? { tipo: "youtube", id: m[1] } : null;
  }
  if (/\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return { tipo: "arquivo", url: url.toString() };
  return { tipo: "link", url: url.toString(), host: host.replace(/^www\./, "") };
}

export function miniaturaYoutube(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Player sem cookies de rastreio; na TV toca sozinho, mudo e em loop. */
export function embedYoutube(id: string, { tv = false } = {}): string {
  const p = new URLSearchParams({ rel: "0", playsinline: "1", modestbranding: "1" });
  if (tv) {
    p.set("autoplay", "1");
    p.set("mute", "1");
    p.set("controls", "0");
    p.set("loop", "1");
    p.set("playlist", id); // o loop do YouTube só funciona repetindo o próprio vídeo na playlist
  } else {
    p.set("autoplay", "1"); // só carrega depois do toque, então já começa tocando
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

export function rotuloLink(host: string): string {
  return host.includes("lancereplay") ? "Assistir no Lance Replay" : `Abrir vídeo (${host})`;
}
