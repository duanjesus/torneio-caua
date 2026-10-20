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
  // Começa vazio: a hora só existe no navegador (no servidor daria outro valor e a página "piscaria").
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (agora === null) return <span className="font-display tabular-nums text-zinc-600">--:--</span>;
  const seg = Math.max(0, Math.floor((agora - new Date(desde).getTime()) / 1000));
  const acabou = seg >= duracao * 60;
  return (
    <span className={`font-display tabular-nums ${acabou ? "animate-pulse text-fla-400" : "text-zinc-300"}`}>
      {String(Math.floor(seg / 60)).padStart(2, "0")}:{String(seg % 60).padStart(2, "0")}
    </span>
  );
}

/**
 * Mostra um painel por vez; cada um fica `duracoes[i]` segundos (padrão 12). Só o painel
 * da vez fica montado: o replay recomeça do início toda vez que aparece. Os títulos viram
 * as bolinhas de baixo, para quem olha saber o que vem depois.
 */
export function Rotacao({ titulos, duracoes = [], children }: { titulos: string[]; duracoes?: number[]; children: React.ReactNode }) {
  const paineis = Children.toArray(children);
  // Guarda o título, não a posição: se um painel entra ou sai da lista, a TV não pula.
  const [titulo, setTitulo] = useState(titulos[0]);
  const atual = Math.max(0, titulos.indexOf(titulo));

  useEffect(() => {
    if (paineis.length < 2) return;
    const t = setTimeout(() => setTitulo(titulos[(atual + 1) % titulos.length]), (duracoes[atual] ?? 12) * 1000);
    return () => clearTimeout(t);
  }, [atual, paineis.length, titulos, duracoes]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <div key={titulos[atual]} className="absolute inset-0 animate-[aparecer_0.6s_ease-out]">
          {paineis[atual]}
        </div>
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

export type GolRecente = {
  id: number;
  autor: string | null;
  foto: string | null;
  contra: boolean;
  time: string;
  cor: string;
  placar: string;
};

/**
 * "GOOOL!" em tela cheia quando entra um gol novo. Compara com o último gol já visto:
 * ao abrir a página não comemora o que já tinha acontecido, e gol apagado não comemora.
 */
export function CelebracaoGol({ gol, segundos = 8 }: { gol: GolRecente | null; segundos?: number }) {
  const [visto, setVisto] = useState<number | null | undefined>(undefined);
  const [mostrando, setMostrando] = useState<GolRecente | null>(null);

  useEffect(() => {
    if (visto === undefined) {
      setVisto(gol?.id ?? null); // primeira carga: só registra
      return;
    }
    if (gol && (visto === null || gol.id > visto)) {
      setVisto(gol.id);
      setMostrando(gol);
    }
  }, [gol, visto]);

  useEffect(() => {
    if (!mostrando) return;
    const t = setTimeout(() => setMostrando(null), segundos * 1000);
    return () => clearTimeout(t);
  }, [mostrando, segundos]);

  if (!mostrando) return null;
  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[1.5vw] text-white animate-[gol-fundo_1.2s_ease-in-out_infinite]"
    >
      <p className="titulo-pincel text-[16vw] leading-none drop-shadow-[0_0.4vw_0_rgba(0,0,0,0.35)] animate-[gol-entra_0.7s_ease-out]">
        {mostrando.contra ? "Gol contra!" : "GOOOL!"}
      </p>
      <div className="flex items-center gap-[2vw]">
        {mostrando.foto && !mostrando.contra ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto servida pela nossa rota
          <img
            src={`/fotos/${mostrando.foto}`}
            alt=""
            className="size-[12vw] rounded-full object-cover"
            style={{ boxShadow: `0 0 0 0.5vw ${mostrando.cor}, 0 0 0 0.8vw #fff` }}
          />
        ) : null}
        <div>
          {mostrando.autor && !mostrando.contra && <p className="font-display text-[6vw] leading-none">{mostrando.autor}</p>}
          <p className="mt-[0.5vw] flex items-center gap-[0.8vw] text-[2.6vw] font-semibold">
            <span className="inline-block size-[2vw] rounded-full ring-[0.2vw] ring-white" style={{ backgroundColor: mostrando.cor }} />
            {mostrando.time}
          </p>
        </div>
      </div>
      <p className="font-display mt-[1vw] rounded-[1vw] bg-black/30 px-[2vw] py-[0.6vw] text-[3.4vw] tracking-wide">{mostrando.placar}</p>
    </div>
  );
}
