"use client";

import { Children, useEffect, useState } from "react";

/** Relógio da parede, em horário de Brasília. */
export function Relogio() {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const t = setInterval(() => setAgora(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);
  if (!agora) return null;
  return (
    <span className="font-display tabular-nums">
      {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
    </span>
  );
}

/** Tempo de jogo desde o apito, contando sozinho entre uma atualização e outra. */
export function CronometroTv({ desde, duracao }: { desde: string; duracao: number }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seg = Math.max(0, Math.floor((agora - new Date(desde).getTime()) / 1000));
  const acabou = seg >= duracao * 60;
  return (
    <span className={`font-display tabular-nums ${acabou ? "animate-pulse text-fla-400" : "text-zinc-300"}`}>
      {String(Math.floor(seg / 60)).padStart(2, "0")}:{String(seg % 60).padStart(2, "0")}
    </span>
  );
}

/**
 * Mostra um painel por vez, trocando a cada `segundos`. Os títulos viram as
 * bolinhas de baixo, para quem olha saber o que vem depois.
 */
export function Rotacao({ titulos, segundos = 12, children }: { titulos: string[]; segundos?: number; children: React.ReactNode }) {
  const paineis = Children.toArray(children);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paineis.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % paineis.length), segundos * 1000);
    return () => clearInterval(t);
  }, [paineis.length, segundos]);
  const atual = i % Math.max(1, paineis.length);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        {paineis.map((p, k) => (
          <div
            key={k}
            aria-hidden={k !== atual}
            className={`absolute inset-0 transition-opacity duration-700 ${k === atual ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {p}
          </div>
        ))}
      </div>
      {paineis.length > 1 && (
        <div className="flex items-center justify-center gap-[1.2vw] pt-[1vw] text-[1vw] text-zinc-500">
          {titulos.map((t, k) => (
            <span key={t} className={`flex items-center gap-[0.4vw] ${k === atual ? "text-white" : ""}`}>
              <span className={`size-[0.6vw] rounded-full ${k === atual ? "bg-fla-500" : "bg-campo-600"}`} />
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Botão discreto de tela cheia; some sozinho quando a TV entra em tela cheia. */
export function TelaCheia() {
  const [cheia, setCheia] = useState(false);
  useEffect(() => {
    const aoMudar = () => setCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);
  if (cheia) return null;
  return (
    <button
      type="button"
      onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
      className="rounded-[0.5vw] border border-campo-600 px-[1vw] py-[0.4vw] text-[0.9vw] text-zinc-400 hover:text-white"
    >
      Tela cheia
    </button>
  );
}
