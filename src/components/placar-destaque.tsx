// Placar grande do jogo que está rolando, com cara de transmissão: faixa da cor de cada time,
// números grandes, cronômetro e quem fez cada gol.

import { nomePublico } from "@/lib/resposta";
import { rotuloFonte } from "@/lib/tabela";
import type { JogoCompleto } from "@/lib/torneio";
import { rotuloJogo } from "./torneio-ui";
import { CronometroTv } from "./tv";

type TimeBase = { id: number; nome: string; cor: string };

export function PlacarDestaque({ jogo, timePorId, duracao }: { jogo: JogoCompleto; timePorId: Map<number, TimeBase>; duracao: number }) {
  const lado = (l: "A" | "B") => {
    const id = l === "A" ? jogo.timeAId : jogo.timeBId;
    const time = id ? timePorId.get(id) : undefined;
    const gols = jogo.gols.filter((g) => g.timeId === id);
    return {
      time,
      nome: time?.nome ?? rotuloFonte(l === "A" ? jogo.fonteA : jogo.fonteB),
      placar: l === "A" ? jogo.golsA : jogo.golsB,
      autores: gols.map((g) => (g.contra ? "contra" : g.crianca ? nomePublico(g.crianca.nome) : "gol")),
    };
  };
  const [a, b] = [lado("A"), lado("B")];

  return (
    <div className="overflow-hidden rounded-2xl border border-fla-500/60 bg-gradient-to-b from-fla-500/[0.12] to-campo-900">
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-zinc-300">
        <span>
          Jogo {jogo.numero} · {rotuloJogo(jogo)} · Campo {jogo.campo}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-fla-500 px-2 py-0.5 font-bold uppercase tracking-wide text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-white" /> Ao vivo
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-2 pt-4">
        {[a, b].map((l, i) => (
          <div key={i} className={`flex min-w-0 flex-col items-center gap-2 text-center ${i === 1 ? "col-start-3" : ""}`}>
            <span className="h-1.5 w-12 rounded-full ring-1 ring-white/30" style={{ backgroundColor: l.time?.cor ?? "#3f3f46" }} />
            <span className="line-clamp-2 text-sm font-semibold leading-tight">{l.nome}</span>
          </div>
        ))}
        <div className="col-start-2 row-start-1 flex items-center gap-3 px-1">
          <span className="font-display text-6xl leading-none tabular-nums">{a.placar}</span>
          <span className="font-display text-2xl text-zinc-500">x</span>
          <span className="font-display text-6xl leading-none tabular-nums">{b.placar}</span>
        </div>
      </div>
      {jogo.iniciadoEm && (
        <p className="pb-1 text-center text-xl">
          <CronometroTv desde={jogo.iniciadoEm.toISOString()} duracao={duracao} />
        </p>
      )}
      {(a.autores.length > 0 || b.autores.length > 0) && (
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 px-4 py-2.5 text-xs text-zinc-300">
          <p className="truncate">{a.autores.map((n) => `⚽ ${n}`).join("  ")}</p>
          <p className="truncate text-right">{b.autores.map((n) => `${n} ⚽`).join("  ")}</p>
        </div>
      )}
    </div>
  );
}
