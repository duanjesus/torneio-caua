"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Contagem regressiva até a bola rolar. No dia, vira um atalho para o placar ao vivo;
 * depois da festa, para os lances. Antes de montar no navegador não mostra nada
 * (a página é estática e a hora certa só existe no celular de quem abre).
 */
export function Contagem({ inicio, fim }: { inicio: string; fim: string }) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (agora === null) return <div className="h-[88px]" aria-hidden="true" />;

  const ini = new Date(inicio).getTime();
  const end = new Date(fim).getTime();

  if (agora >= ini) {
    const rolando = agora < end;
    return (
      <Link
        href="/torneio"
        className="flex items-center justify-between gap-3 rounded-2xl border border-fla-500 bg-gradient-to-r from-fla-500/25 to-fla-500/5 px-5 py-4"
      >
        <span>
          <span className="font-display block text-3xl leading-none tracking-wide">{rolando ? "A bola tá rolando!" : "Foi demais!"}</span>
          <span className="text-sm text-zinc-300">{rolando ? "Placar, tabela e lances ao vivo" : "Veja os resultados e os melhores lances"}</span>
        </span>
        <span className="shrink-0 rounded-full bg-fla-500 px-3 py-1.5 text-sm font-semibold text-white">Abrir</span>
      </Link>
    );
  }

  const min = Math.floor((ini - agora) / 60_000);
  const partes = [
    { valor: Math.floor(min / 1440), rotulo: "dias" },
    { valor: Math.floor((min % 1440) / 60), rotulo: "horas" },
    { valor: min % 60, rotulo: "min" },
  ];
  return (
    <div className="rounded-2xl border border-campo-700 bg-campo-900 px-4 py-3">
      <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">Falta pouco para a bola rolar</p>
      <div className="mt-1 grid grid-cols-3 divide-x divide-campo-700 text-center">
        {partes.map((p) => (
          <div key={p.rotulo}>
            <span className="font-display block text-4xl leading-none tabular-nums text-white">{String(p.valor).padStart(2, "0")}</span>
            <span className="text-xs text-zinc-500">{p.rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
