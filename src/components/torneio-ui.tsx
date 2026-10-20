// Peças visuais do campeonato, usadas no painel e na página pública.

import Link from "next/link";
import type { LinhaClassificacao } from "@/lib/campeonato";
import { ROTULO_FASE, rotuloFonte, type Fase } from "@/lib/tabela";
import type { JogoCompleto } from "@/lib/torneio";

type TimeBase = { id: number; nome: string; cor: string };

export function CorTime({ cor, className = "size-3.5" }: { cor: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ring-1 ring-white/30 ${className}`}
      style={{ backgroundColor: cor }}
    />
  );
}

export function NomeTime({ time, fonte }: { time: TimeBase | null | undefined; fonte?: string | null }) {
  if (!time) return <span className="truncate italic text-zinc-500">{rotuloFonte(fonte ?? null)}</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <CorTime cor={time.cor} />
      <span className="truncate">{time.nome}</span>
    </span>
  );
}

export function rotuloJogo(j: Pick<JogoCompleto, "fase" | "grupo">): string {
  return j.fase === "GRUPOS" ? `Grupo ${j.grupo}` : ROTULO_FASE[j.fase as Fase];
}

export function SeloStatus({ status }: { status: JogoCompleto["status"] }) {
  if (status === "AO_VIVO")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-fla-500 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
        <span className="size-1.5 animate-pulse rounded-full bg-white" />
        Ao vivo
      </span>
    );
  if (status === "ENCERRADO") return <span className="text-xs text-zinc-500">Encerrado</span>;
  return null;
}

/** Um jogo: cabeçalho com número, horário e fase, e os dois times com o placar. */
export function CartaoJogo({
  jogo,
  timePorId,
  href,
  compacto = false,
}: {
  jogo: JogoCompleto;
  timePorId: Map<number, TimeBase>;
  href?: string;
  compacto?: boolean;
}) {
  const a = jogo.timeAId ? timePorId.get(jogo.timeAId) : null;
  const b = jogo.timeBId ? timePorId.get(jogo.timeBId) : null;
  const comecou = jogo.status !== "AGENDADO";
  const temPenaltis = jogo.penaltisA !== null && jogo.penaltisB !== null;
  const vencedorA = jogo.status === "ENCERRADO" && (jogo.golsA > jogo.golsB || (temPenaltis && jogo.penaltisA! > jogo.penaltisB!));
  const vencedorB = jogo.status === "ENCERRADO" && (jogo.golsB > jogo.golsA || (temPenaltis && jogo.penaltisB! > jogo.penaltisA!));

  const linha = (time: TimeBase | null | undefined, fonte: string | null, gols: number, pen: number | null, venceu: boolean) => (
    <div className={`flex items-center justify-between gap-3 ${venceu ? "font-semibold text-white" : ""}`}>
      <NomeTime time={time} fonte={fonte} />
      <span className="flex shrink-0 items-baseline gap-1.5">
        {temPenaltis && <span className="text-xs text-zinc-500">({pen})</span>}
        <span className={`font-display text-2xl leading-none tabular-nums ${comecou ? "" : "text-zinc-600"}`}>
          {comecou ? gols : "–"}
        </span>
      </span>
    </div>
  );

  const corpo = (
    <div
      className={`cartao block ${compacto ? "p-3" : "p-4"} ${
        jogo.status === "AO_VIVO" ? "border-fla-500/70 bg-fla-500/[0.06]" : ""
      } ${href ? "transition-colors hover:border-campo-600 hover:bg-campo-800" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="truncate">
          Jogo {jogo.numero} · {jogo.horario}
          {!compacto && ` · Campo ${jogo.campo}`} · {rotuloJogo(jogo)}
        </span>
        <SeloStatus status={jogo.status} />
      </div>
      <div className="space-y-1.5">
        {linha(a, jogo.fonteA, jogo.golsA, jogo.penaltisA, vencedorA)}
        {linha(b, jogo.fonteB, jogo.golsB, jogo.penaltisB, vencedorB)}
      </div>
    </div>
  );
  return href ? <Link href={href}>{corpo}</Link> : corpo;
}

export function TabelaGrupo({
  grupo,
  linhas,
  timePorId,
  classificados,
}: {
  grupo: string;
  linhas: LinhaClassificacao[];
  timePorId: Map<number, TimeBase>;
  classificados: number;
}) {
  return (
    <div className="cartao overflow-hidden">
      <h3 className="font-display px-4 pt-3 text-2xl tracking-wide">Grupo {grupo}</h3>
      <table className="mt-1 w-full text-sm">
        <thead className="text-xs text-zinc-500">
          <tr>
            <th className="w-8 py-2 pl-4 text-left font-normal">#</th>
            <th className="py-2 text-left font-normal">Time</th>
            <th className="w-9 py-2 text-center font-semibold text-zinc-300" title="Pontos">P</th>
            <th className="w-8 py-2 text-center font-normal" title="Jogos">J</th>
            <th className="w-8 py-2 text-center font-normal" title="Vitórias">V</th>
            <th className="hidden w-8 py-2 text-center font-normal sm:table-cell" title="Empates">E</th>
            <th className="hidden w-8 py-2 text-center font-normal sm:table-cell" title="Derrotas">D</th>
            <th className="w-10 py-2 pr-4 text-center font-normal" title="Saldo de gols">SG</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.timeId} className="border-t border-campo-700">
              <td className={`py-2 pl-4 tabular-nums ${i < classificados ? "font-bold text-fla-400" : "text-zinc-500"}`}>{i + 1}</td>
              <td className="max-w-0 py-2">
                <NomeTime time={timePorId.get(l.timeId)} />
              </td>
              <td className="py-2 text-center font-semibold tabular-nums">{l.pts}</td>
              <td className="py-2 text-center tabular-nums text-zinc-400">{l.j}</td>
              <td className="py-2 text-center tabular-nums text-zinc-400">{l.v}</td>
              <td className="hidden py-2 text-center tabular-nums text-zinc-400 sm:table-cell">{l.e}</td>
              <td className="hidden py-2 text-center tabular-nums text-zinc-400 sm:table-cell">{l.d}</td>
              <td className="py-2 pr-4 text-center tabular-nums text-zinc-400">{l.sg > 0 ? `+${l.sg}` : l.sg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ORDEM_CHAVE: Fase[] = ["OITAVAS", "QUARTAS", "SEMI", "FINAL"];

/** Mata-mata em colunas por fase; a disputa de 3º lugar fica embaixo da final. */
export function Chave({
  jogos,
  timePorId,
  hrefJogo,
}: {
  jogos: JogoCompleto[];
  timePorId: Map<number, TimeBase>;
  hrefJogo?: (j: JogoCompleto) => string;
}) {
  const fases = ORDEM_CHAVE.filter((f) => jogos.some((j) => j.fase === f));
  const terceiro = jogos.find((j) => j.fase === "TERCEIRO");
  if (fases.length === 0) return null;
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex min-w-max gap-3">
        {fases.map((f) => (
          <div key={f} className="flex w-60 flex-col">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">{ROTULO_FASE[f]}</h3>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {jogos
                .filter((j) => j.fase === f)
                .map((j) => (
                  <CartaoJogo key={j.id} jogo={j} timePorId={timePorId} compacto href={hrefJogo?.(j)} />
                ))}
              {f === "FINAL" && terceiro && (
                <div>
                  <h3 className="mb-2 mt-2 text-sm font-medium text-zinc-400">{ROTULO_FASE.TERCEIRO}</h3>
                  <CartaoJogo jogo={terceiro} timePorId={timePorId} compacto href={hrefJogo?.(terceiro)} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Artilharia({
  artilharia,
  timePorId,
  nome = (n) => n,
  limite = 10,
}: {
  artilharia: { criancaId: number; nome: string; timeId: number; gols: number }[];
  timePorId: Map<number, TimeBase>;
  nome?: (n: string) => string;
  limite?: number;
}) {
  if (artilharia.length === 0) return <p className="text-sm text-zinc-500">Nenhum gol ainda.</p>;
  return (
    <ol className="space-y-2">
      {artilharia.slice(0, limite).map((a, i) => {
        const time = timePorId.get(a.timeId);
        return (
          <li key={a.criancaId} className="flex items-center gap-3">
            <span className="w-5 text-right text-sm tabular-nums text-zinc-500">{i + 1}</span>
            {time && <CorTime cor={time.cor} />}
            <span className="min-w-0 flex-1 truncate">{nome(a.nome)}</span>
            <span className="font-display text-2xl leading-none tabular-nums text-fla-400">{a.gols}</span>
          </li>
        );
      })}
    </ol>
  );
}
