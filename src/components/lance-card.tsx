"use client";

import { useState } from "react";
import { embedYoutube, miniaturaYoutube, rotuloLink, type Video } from "@/lib/video";

/**
 * Card de um lance. O player do YouTube só carrega no toque (a página continua leve
 * com muitos lances); link de outro site abre numa aba nova.
 */
export function LanceCard({
  video,
  titulo,
  subtitulo,
  cor,
}: {
  video: Video;
  titulo: string;
  subtitulo: string | null;
  cor: string | null;
}) {
  const [tocando, setTocando] = useState(false);

  const legenda = (
    <div className="flex items-start gap-2 p-3">
      {cor && <span className="mt-1 h-4 w-1 shrink-0 rounded-full" style={{ backgroundColor: cor }} />}
      <div className="min-w-0">
        <p className="truncate font-semibold">{titulo}</p>
        {subtitulo && <p className="truncate text-xs text-zinc-400">{subtitulo}</p>}
      </div>
    </div>
  );

  if (video.tipo === "link") {
    return (
      <a href={video.url} target="_blank" rel="noreferrer" className="cartao block overflow-hidden transition-colors hover:border-campo-600">
        <div className="flex aspect-video items-center justify-center bg-campo-800 text-sm font-medium text-zinc-300">
          <span className="flex items-center gap-2 rounded-full bg-fla-500 px-4 py-2 text-white">▶ {rotuloLink(video.host)}</span>
        </div>
        {legenda}
      </a>
    );
  }

  return (
    <div className="cartao overflow-hidden">
      <div className="relative aspect-video bg-black">
        {video.tipo === "arquivo" ? (
          <video src={video.url} controls playsInline preload="metadata" className="h-full w-full" />
        ) : tocando ? (
          <iframe
            src={embedYoutube(video.id)}
            title={titulo}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button type="button" onClick={() => setTocando(true)} className="group absolute inset-0" aria-label={`Assistir: ${titulo}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do YouTube */}
            <img src={miniaturaYoutube(video.id)} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-fla-500 pl-1 text-2xl text-white shadow-lg transition-transform group-hover:scale-110">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      {legenda}
    </div>
  );
}
