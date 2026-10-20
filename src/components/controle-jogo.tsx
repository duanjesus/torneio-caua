"use client";

import { useEffect, useState, useTransition } from "react";
import {
  desfazerGol,
  encerrarJogo,
  iniciarJogo,
  marcarGol,
  reabrirJogo,
  voltarParaAgendado,
  type Retorno,
} from "@/app/admin/torneio-actions";

type Lado = { id: number | null; nome: string; cor: string; jogadores: { id: number; nome: string }[] };
type Gol = { id: number; timeId: number; autor: string | null; contra: boolean; em: string };
type Jogo = {
  id: number;
  status: "AGENDADO" | "AO_VIVO" | "ENCERRADO";
  mataMata: boolean;
  iniciadoEm: string | null;
  golsA: number;
  golsB: number;
  penaltisA: number | null;
  penaltisB: number | null;
  gols: Gol[];
};

function Cronometro({ desde, duracao }: { desde: string; duracao: number }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seg = Math.max(0, Math.floor((agora - new Date(desde).getTime()) / 1000));
  const passou = seg >= duracao * 60;
  return (
    <p className={`font-display text-center text-4xl tabular-nums ${passou ? "animate-pulse text-fla-400" : "text-zinc-300"}`}>
      {String(Math.floor(seg / 60)).padStart(2, "0")}:{String(seg % 60).padStart(2, "0")}
      <span className="ml-2 text-lg text-zinc-500">/ {duracao}:00</span>
      {passou && <span className="block text-sm font-sans not-italic tracking-normal">Acabou o tempo</span>}
    </p>
  );
}

export function ControleJogo({ jogo, timeA, timeB, duracao }: { jogo: Jogo; timeA: Lado; timeB: Lado; duracao: number }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  /** Time que fez o gol e se a lista mostra quem fez contra. */
  const [escolhendo, setEscolhendo] = useState<{ lado: "A" | "B"; contra: boolean } | null>(null);
  const [penaltis, setPenaltis] = useState<{ a: string; b: string } | null>(null);

  const rodar = (fn: () => Promise<Retorno>, depois?: () => void) =>
    iniciar(async () => {
      setErro(null);
      try {
        const r = await fn();
        if (r.ok) depois?.();
        else setErro(r.erro);
      } catch {
        setErro("Sem conexão? Não deu para salvar. Tente de novo.");
      }
    });

  const definido = timeA.id !== null && timeB.id !== null;
  const aoVivo = jogo.status === "AO_VIVO";
  const empate = jogo.golsA === jogo.golsB;

  function gol(timeId: number, criancaId: number | null, contra: boolean) {
    rodar(() => marcarGol(jogo.id, { timeId, criancaId, contra }), () => setEscolhendo(null));
  }

  function encerrar() {
    if (jogo.mataMata && empate && !penaltis) {
      setPenaltis({ a: "", b: "" });
      return;
    }
    const pen = penaltis ? { a: penaltis.a === "" ? null : Number(penaltis.a), b: penaltis.b === "" ? null : Number(penaltis.b) } : { a: null, b: null };
    if (!penaltis && !confirm(`Encerrar com ${jogo.golsA} x ${jogo.golsB}?`)) return;
    rodar(() => encerrarJogo(jogo.id, pen), () => setPenaltis(null));
  }

  const placar = (lado: Lado, gols: number, pen: number | null) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <span className="h-2 w-16 rounded-full ring-1 ring-white/30" style={{ backgroundColor: lado.cor }} />
      <span className={`line-clamp-2 min-h-12 font-semibold ${lado.id ? "" : "italic text-zinc-500"}`}>{lado.nome}</span>
      <span className="font-display text-8xl leading-none tabular-nums">{jogo.status === "AGENDADO" ? "–" : gols}</span>
      {pen !== null && <span className="text-sm text-zinc-400">pênaltis: {pen}</span>}
    </div>
  );

  const ladoEscolhido = escolhendo ? (escolhendo.lado === "A" ? timeA : timeB) : null;
  const outroLado = escolhendo ? (escolhendo.lado === "A" ? timeB : timeA) : null;

  return (
    <div className="space-y-4">
      <div className={`cartao p-5 ${aoVivo ? "border-fla-500/70" : ""}`}>
        <div className="flex items-start gap-3">
          {placar(timeA, jogo.golsA, jogo.penaltisA)}
          <span className="font-display pt-20 text-3xl text-zinc-600">x</span>
          {placar(timeB, jogo.golsB, jogo.penaltisB)}
        </div>
        {aoVivo && jogo.iniciadoEm && (
          <div className="mt-4">
            <Cronometro desde={jogo.iniciadoEm} duracao={duracao} />
          </div>
        )}
        {jogo.status === "ENCERRADO" && <p className="mt-4 text-center text-sm font-medium text-zinc-400">Encerrado</p>}
      </div>

      {jogo.status === "AGENDADO" && (
        <button
          type="button"
          disabled={!definido || pendente}
          onClick={() => rodar(() => iniciarJogo(jogo.id))}
          className="btn-primario w-full py-4 text-xl"
        >
          {definido ? (pendente ? "Começando…" : "▶ Começar jogo") : "Aguardando os times"}
        </button>
      )}

      {aoVivo && !escolhendo && !penaltis && (
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B"] as const).map((l) => (
            <button
              key={l}
              type="button"
              disabled={pendente}
              onClick={() => setEscolhendo({ lado: l, contra: false })}
              className="btn py-5 text-xl text-white"
              style={{ backgroundColor: "var(--color-campo-700)", boxShadow: `inset 0 -4px 0 ${(l === "A" ? timeA : timeB).cor}` }}
            >
              ⚽ Gol
            </button>
          ))}
        </div>
      )}

      {escolhendo && ladoEscolhido && outroLado && ladoEscolhido.id !== null && (
        <div className="cartao space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {escolhendo.contra ? `Gol contra a favor do ${ladoEscolhido.nome}: quem fez?` : `Gol do ${ladoEscolhido.nome}: quem fez?`}
            </h2>
            <button type="button" onClick={() => setEscolhendo(null)} className="text-sm text-zinc-400 hover:text-white">
              Cancelar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(escolhendo.contra ? outroLado : ladoEscolhido).jogadores.map((j) => (
              <button
                key={j.id}
                type="button"
                disabled={pendente}
                onClick={() => gol(ladoEscolhido.id!, j.id, escolhendo.contra)}
                className="btn-secundario justify-start truncate px-3 text-left text-sm"
              >
                {j.nome}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-campo-700 pt-3">
            <button type="button" disabled={pendente} onClick={() => gol(ladoEscolhido.id!, null, escolhendo.contra)} className="btn-pequeno">
              Não sei quem fez
            </button>
            {!escolhendo.contra && (
              <button type="button" onClick={() => setEscolhendo({ ...escolhendo, contra: true })} className="btn-pequeno">
                Foi gol contra
              </button>
            )}
          </div>
        </div>
      )}

      {penaltis && (
        <div className="cartao space-y-3 p-4">
          <h2 className="font-semibold">Empate no mata-mata: placar dos pênaltis</h2>
          <div className="flex items-end gap-3">
            {(["a", "b"] as const).map((k) => (
              <div key={k} className="flex-1">
                <label htmlFor={`pen-${k}`} className="rotulo truncate">
                  {(k === "a" ? timeA : timeB).nome}
                </label>
                <input
                  id={`pen-${k}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={30}
                  className="campo font-display text-center text-3xl"
                  value={penaltis[k]}
                  onChange={(e) => setPenaltis({ ...penaltis, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={pendente} onClick={encerrar} className="btn-primario flex-1">
              Encerrar jogo
            </button>
            <button type="button" onClick={() => setPenaltis(null)} className="btn-secundario">
              Voltar
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="rounded-xl border border-fla-500/40 bg-fla-500/10 px-4 py-3 text-sm text-fla-400">
          {erro}
        </p>
      )}

      {jogo.gols.length > 0 && (
        <section className="cartao p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-400">Gols</h2>
          <ol className="space-y-2">
            {jogo.gols.map((g) => {
              const time = g.timeId === timeA.id ? timeA : timeB;
              return (
                <li key={g.id} className="flex items-center gap-3 text-sm">
                  <span className="size-3 shrink-0 rounded-full ring-1 ring-white/30" style={{ backgroundColor: time.cor }} />
                  <span className="min-w-0 flex-1 truncate">
                    {g.autor ?? "Sem autor"}
                    {g.contra && <span className="text-zinc-500"> (contra)</span>}
                    <span className="text-zinc-500"> · {time.nome}</span>
                  </span>
                  {aoVivo && (
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() => confirm("Apagar este gol?") && rodar(() => desfazerGol(g.id))}
                      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-campo-800 hover:text-fla-400"
                    >
                      Apagar
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {aoVivo && !penaltis && !escolhendo && (
        <div className="space-y-2">
          <button type="button" disabled={pendente} onClick={encerrar} className="btn w-full border border-campo-600 bg-white py-4 text-lg text-black hover:bg-zinc-200">
            ⏹ Encerrar jogo
          </button>
          {jogo.gols.length === 0 && (
            <button
              type="button"
              disabled={pendente}
              onClick={() => rodar(() => voltarParaAgendado(jogo.id))}
              className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300"
            >
              Começou sem querer? Voltar para “não começou”
            </button>
          )}
        </div>
      )}

      {jogo.status === "ENCERRADO" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => confirm("Reabrir o jogo para corrigir o placar?") && rodar(() => reabrirJogo(jogo.id))}
          className="btn-secundario w-full text-sm"
        >
          Reabrir para corrigir
        </button>
      )}
    </div>
  );
}
