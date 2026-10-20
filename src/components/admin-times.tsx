"use client";

import { useState, useTransition } from "react";
import { moverJogador, salvarTime, sortearTimesAcao, type Retorno } from "@/app/admin/torneio-actions";
import { CORES, MAX_TIMES } from "@/lib/sorteio";
import { CorTime } from "./torneio-ui";

type Jogador = { id: number; nome: string; idade: number; goleiro: boolean; nivel: number | null };
type TimeOpcao = { id: number; nome: string; cor: string };

/** Executa uma ação do servidor e guarda a mensagem de erro, se vier. */
function useAcao() {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const rodar = (fn: () => Promise<Retorno>) =>
    iniciar(async () => {
      setErro(null);
      try {
        const r = await fn();
        if (!r.ok) setErro(r.erro);
      } catch {
        setErro("Não deu para salvar. Tente de novo.");
      }
    });
  return { pendente, erro, rodar };
}

export function SorteioTimes({ jogadores, timesAtuais, temTabela }: { jogadores: number; timesAtuais: number; temTabela: boolean }) {
  const maximo = Math.max(2, Math.min(MAX_TIMES, jogadores));
  const sugestao = Math.min(maximo, Math.max(2, timesAtuais || Math.round(jogadores / 6) || 2));
  const [numTimes, setNumTimes] = useState(sugestao);
  const { pendente, erro, rodar } = useAcao();
  const porTime = jogadores / numTimes;

  function sortear() {
    if (timesAtuais > 0) {
      const aviso = temTabela
        ? "Sortear de novo desfaz os times atuais e APAGA a tabela e os placares. Continuar?"
        : "Sortear de novo desfaz os times atuais. Continuar?";
      if (!confirm(aviso)) return;
    }
    rodar(() => sortearTimesAcao(numTimes));
  }

  return (
    <div className="cartao space-y-4 p-5">
      <div>
        <h2 className="font-display text-2xl tracking-wide">Sorteio</h2>
        <p className="text-sm text-zinc-400">
          Entram os {jogadores} jogadores <strong className="text-zinc-200">confirmados</strong>. O sorteio espalha os goleiros e
          equilibra pelo nível e pela idade.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="num-times" className="rotulo">
            Quantos times
          </label>
          <select
            id="num-times"
            className="campo w-32"
            value={numTimes}
            onChange={(e) => setNumTimes(Number(e.target.value))}
          >
            {Array.from({ length: MAX_TIMES - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n} disabled={n > maximo}>
                {n} times
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={sortear} disabled={pendente || jogadores < 2} className="btn-primario">
          {pendente ? "Sorteando…" : timesAtuais > 0 ? "Sortear de novo" : "Sortear times"}
        </button>
      </div>
      {jogadores >= 2 && (
        <p className="text-sm text-zinc-400">
          ≈ {porTime % 1 === 0 ? porTime : `${Math.floor(porTime)} a ${Math.ceil(porTime)}`} jogadores por time.
        </p>
      )}
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}

export function CartaoTime({
  time,
  jogadores,
  outros,
}: {
  time: TimeOpcao;
  jogadores: Jogador[];
  outros: TimeOpcao[];
}) {
  const [nome, setNome] = useState(time.nome);
  const [editando, setEditando] = useState(false);
  const { pendente, erro, rodar } = useAcao();
  const goleiros = jogadores.filter((j) => j.goleiro).length;
  const nivelMedio = jogadores.length
    ? (jogadores.reduce((s, j) => s + (j.nivel ?? 2), 0) / jogadores.length).toFixed(1)
    : "–";

  return (
    <div className="cartao overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: time.cor }} />
      <div className="space-y-3 p-4">
        {editando ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              rodar(async () => {
                const r = await salvarTime(time.id, { nome, cor: time.cor });
                if (r.ok) setEditando(false);
                return r;
              });
            }}
          >
            <input className="campo py-2" value={nome} maxLength={30} onChange={(e) => setNome(e.target.value)} autoFocus aria-label="Nome do time" />
            <div className="flex gap-2">
              <button className="btn-pequeno border-fla-500 bg-fla-500" disabled={pendente}>
                Salvar
              </button>
              <button type="button" className="btn-pequeno" onClick={() => (setNome(time.nome), setEditando(false))}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-2xl leading-tight tracking-wide">{time.nome}</h3>
            <button type="button" onClick={() => setEditando(true)} className="shrink-0 text-sm text-zinc-400 hover:text-white">
              Renomear
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Cor do colete do ${time.nome}`}>
          {CORES.map((c) => (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={c.hex === time.cor}
              title={c.nome}
              aria-label={c.nome}
              onClick={() => rodar(() => salvarTime(time.id, { nome: time.nome, cor: c.hex }))}
              className={`rounded-full p-0.5 ${c.hex === time.cor ? "ring-2 ring-white" : ""}`}
            >
              <CorTime cor={c.hex} className="size-5" />
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-500">
          {jogadores.length} jogadores · {goleiros} {goleiros === 1 ? "goleiro" : "goleiros"} · nível médio {nivelMedio}
        </p>

        <ul className="divide-y divide-campo-700 border-t border-campo-700">
          {jogadores.map((j) => (
            <LinhaJogadorTime key={j.id} jogador={j} timeAtual={time.id} opcoes={outros} />
          ))}
        </ul>
        {erro && <p className="erro">{erro}</p>}
      </div>
    </div>
  );
}

export function LinhaJogadorTime({
  jogador,
  timeAtual,
  opcoes,
}: {
  jogador: Jogador;
  timeAtual: number | null;
  opcoes: TimeOpcao[];
}) {
  const { pendente, erro, rodar } = useAcao();
  return (
    <li className={`flex items-center gap-2 py-2 ${pendente ? "opacity-50" : ""}`}>
      <span className="min-w-0 flex-1 truncate text-sm">
        {jogador.nome} <span className="text-zinc-500">{jogador.idade}a</span>
        {jogador.goleiro && " 🧤"}
        {jogador.nivel && <span className="ml-1 text-xs text-zinc-500">N{jogador.nivel}</span>}
      </span>
      <select
        aria-label={`Mover ${jogador.nome}`}
        className="max-w-36 rounded-lg border border-campo-600 bg-campo-900 px-2 py-1 text-xs text-zinc-300"
        value=""
        disabled={pendente}
        onChange={(e) => {
          const v = e.target.value;
          if (v) rodar(() => moverJogador(jogador.id, v === "nenhum" ? null : Number(v)));
        }}
      >
        <option value="">{timeAtual === null ? "Pôr no time…" : "Mover…"}</option>
        {opcoes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
        {timeAtual !== null && <option value="nenhum">Tirar do time</option>}
      </select>
      {erro && <span className="erro">{erro}</span>}
    </li>
  );
}
