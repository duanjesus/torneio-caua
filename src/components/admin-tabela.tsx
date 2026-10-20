"use client";

import { useMemo, useState, useTransition } from "react";
import { apagarTabela, gerarTabela, publicar, type Retorno } from "@/app/admin/torneio-actions";
import { EVENTO } from "@/lib/evento";
import { distribuirGrupos, minutos, montarTabela, validarConfig, type ConfigTabela } from "@/lib/tabela";

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

/** Descrição do formato em uma linha, para a prévia. */
function descrever(cfg: ConfigTabela, numTimes: number): string {
  if (cfg.formato === "MATA") return `Mata-mata direto com ${numTimes} times.`;
  const porGrupo = numTimes / cfg.numGrupos;
  const tam = porGrupo % 1 === 0 ? `${porGrupo}` : `${Math.floor(porGrupo)} ou ${Math.ceil(porGrupo)}`;
  const grupos = cfg.numGrupos === 1 ? "Todos contra todos" : `${cfg.numGrupos} grupos de ${tam}`;
  const total = cfg.numGrupos * cfg.classificados;
  if (total === 0) return `${grupos}; campeão é quem fizer mais pontos.`;
  const mata = { 2: "final", 4: "semifinal e final", 8: "quartas, semi e final", 16: "oitavas até a final" }[total];
  return `${grupos}; ${total} classificados vão para ${mata}.`;
}

export function ConfigTabelaForm({ inicial, numTimes, temJogosIniciados, temTabela }: {
  inicial: ConfigTabela;
  numTimes: number;
  temJogosIniciados: boolean;
  temTabela: boolean;
}) {
  const [cfg, setCfg] = useState<ConfigTabela>(inicial);
  const { pendente, erro, rodar } = useAcao();
  const mudar = <K extends keyof ConfigTabela>(k: K, v: ConfigTabela[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const previa = useMemo(() => {
    const problema = validarConfig(cfg, numTimes);
    if (problema) return { problema };
    const ids = Array.from({ length: numTimes }, (_, i) => i + 1);
    const { jogos, termino } = montarTabela(
      cfg,
      cfg.formato === "GRUPOS" ? { grupos: distribuirGrupos(ids, cfg.numGrupos) } : { timesMata: ids },
    );
    // jogos por time na fase de grupos (o mínimo que cada criança joga)
    const porTime = cfg.formato === "GRUPOS" ? Math.floor(numTimes / cfg.numGrupos) - 1 : 1;
    return { jogos: jogos.length, termino, porTime, passa: minutos(termino) > minutos(EVENTO.fim) };
  }, [cfg, numTimes]);

  function gerar() {
    const aviso = temJogosIniciados
      ? "Já tem jogo com placar. Gerar de novo APAGA todos os jogos e placares e sorteia os grupos outra vez. Continuar?"
      : temTabela
        ? "Gerar de novo refaz a tabela e sorteia os grupos outra vez. Continuar?"
        : null;
    if (aviso && !confirm(aviso)) return;
    rodar(() => gerarTabela(cfg));
  }

  const numero = (k: "campos" | "duracao" | "intervalo", rotulo: string, min: number, max: number, sufixo: string) => (
    <div>
      <label htmlFor={k} className="rotulo">
        {rotulo}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={k}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          className="campo w-24"
          value={cfg[k]}
          onChange={(e) => mudar(k, Number(e.target.value))}
        />
        <span className="text-sm text-zinc-400">{sufixo}</span>
      </div>
    </div>
  );

  return (
    <div className="cartao space-y-5 p-5">
      <h2 className="font-display text-2xl tracking-wide">Formato</h2>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["GRUPOS", "Grupos", "Todos contra todos no grupo, depois mata-mata"],
            ["MATA", "Mata-mata", "Perdeu, saiu. Menos jogos por criança"],
          ] as const
        ).map(([valor, titulo, texto]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={cfg.formato === valor}
            onClick={() => mudar("formato", valor)}
            className={`rounded-xl border p-3 text-left ${
              cfg.formato === valor ? "border-fla-500 bg-fla-500/10" : "border-campo-600 hover:bg-campo-800"
            }`}
          >
            <span className="font-display block text-xl tracking-wide">{titulo}</span>
            <span className="text-xs text-zinc-400">{texto}</span>
          </button>
        ))}
      </div>

      {cfg.formato === "GRUPOS" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="numGrupos" className="rotulo">
              Grupos
            </label>
            <select
              id="numGrupos"
              className="campo"
              value={cfg.numGrupos}
              onChange={(e) => {
                const n = Number(e.target.value);
                setCfg((c) => ({ ...c, numGrupos: n, classificados: n > 1 && c.classificados === 0 ? 2 : c.classificados }));
              }}
            >
              <option value={1}>1 grupo (pontos corridos)</option>
              <option value={2}>2 grupos</option>
              <option value={4}>4 grupos</option>
            </select>
          </div>
          <div>
            <label htmlFor="classificados" className="rotulo">
              Classificados por grupo
            </label>
            <select
              id="classificados"
              className="campo"
              value={cfg.classificados}
              onChange={(e) => mudar("classificados", Number(e.target.value))}
            >
              {cfg.numGrupos === 1 && <option value={0}>Nenhum (sem mata-mata)</option>}
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-fla-500"
          checked={cfg.terceiroLugar}
          onChange={(e) => mudar("terceiroLugar", e.target.checked)}
        />
        Disputa de 3º lugar
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="inicio" className="rotulo">
            1º jogo às
          </label>
          <input id="inicio" type="time" className="campo" value={cfg.inicio} onChange={(e) => mudar("inicio", e.target.value)} />
        </div>
        {numero("campos", "Campos", 1, 4, "ao mesmo tempo")}
        {numero("duracao", "Cada jogo", 4, 60, "min")}
        {numero("intervalo", "Entre jogos", 0, 30, "min")}
      </div>

      <div className={`rounded-xl border p-4 text-sm ${"problema" in previa ? "border-fla-500/50 bg-fla-500/10" : "border-campo-600 bg-campo-950"}`}>
        {"problema" in previa ? (
          <p className="text-fla-400">{previa.problema}</p>
        ) : (
          <div className="space-y-1">
            <p className="text-zinc-200">{descrever(cfg, numTimes)}</p>
            <p className="text-zinc-400">
              <strong className="text-white">{previa.jogos} jogos</strong> · cada time joga pelo menos {previa.porTime}{" "}
              {previa.porTime === 1 ? "vez" : "vezes"} · termina por volta das{" "}
              <strong className={previa.passa ? "text-amber-400" : "text-white"}>{previa.termino.replace(":", "h")}</strong>
            </p>
            {previa.passa && (
              <p className="text-amber-400">Passa do fim da festa ({EVENTO.horario}). Diminua o tempo de jogo ou use mais campos.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={gerar} disabled={pendente || "problema" in previa} className="btn-primario">
          {pendente ? "Gerando…" : temTabela ? "Gerar tabela de novo" : "Gerar tabela"}
        </button>
        {temTabela && (
          <button
            type="button"
            className="btn-secundario text-sm"
            disabled={pendente}
            onClick={() => confirm("Apagar a tabela e todos os placares?") && rodar(apagarTabela)}
          >
            Apagar tabela
          </button>
        )}
      </div>
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}

export function Publicar({ publicado }: { publicado: boolean }) {
  const { pendente, erro, rodar } = useAcao();
  return (
    <div className={`cartao flex flex-wrap items-center justify-between gap-3 p-4 ${publicado ? "border-emerald-500/50" : ""}`}>
      <div>
        <p className="font-medium">{publicado ? "Times e tabela estão no site" : "Times e tabela estão escondidos"}</p>
        <p className="text-sm text-zinc-400">
          {publicado ? "Todo mundo vê em /torneio, com placar ao vivo." : "O site mostra “em breve” até você publicar."}
        </p>
      </div>
      <button
        type="button"
        disabled={pendente}
        onClick={() => rodar(() => publicar(!publicado))}
        className={publicado ? "btn-secundario text-sm" : "btn-primario text-sm"}
      >
        {publicado ? "Esconder" : "Publicar no site"}
      </button>
      {erro && <p className="erro w-full">{erro}</p>}
    </div>
  );
}
