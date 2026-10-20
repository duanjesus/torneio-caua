import Link from "next/link";
import { CompartilharConvite } from "@/components/compartilhar-convite";
import { SeloPresenca } from "@/components/selo-presenca";
import { db } from "@/lib/db";
import { EVENTO, mensagemConvite, prazoEncerrado, publicUrl } from "@/lib/evento";
import { configTorneio } from "@/lib/torneio";

export const dynamic = "force-dynamic";

export default async function Resumo() {
  const [respostas, config, numTimes, jogos, lances] = await Promise.all([
    db.resposta.findMany({ include: { criancas: true }, orderBy: { atualizadoEm: "desc" } }),
    configTorneio(),
    db.time.count(),
    db.jogo.findMany({ select: { status: true } }),
    db.lance.count(),
  ]);

  const por = (p: string) => respostas.filter((r) => r.presenca === p);
  const pessoas = (lista: typeof respostas) => ({
    adultos: lista.reduce((s, r) => s + r.adultos, 0),
    criancas: lista.reduce((s, r) => s + r.criancas.length, 0),
  });
  const sim = pessoas(por("SIM"));
  const talvez = pessoas(por("TALVEZ"));
  const jogadores = respostas.flatMap((r) => r.criancas.filter((c) => c.joga).map((c) => ({ ...c, presenca: r.presenca })));
  const jogadoresSim = jogadores.filter((j) => j.presenca === "SIM").length;

  const semNivel = respostas
    .filter((r) => r.presenca === "SIM")
    .flatMap((r) => r.criancas)
    .filter((c) => c.joga && c.nivel === null).length;
  const encerrados = jogos.filter((j) => j.status === "ENCERRADO").length;

  // O roteiro até a festa; o primeiro passo não feito fica em destaque.
  const passos: Passo[] = [
    { feito: respostas.length > 0, titulo: "Mandar o convite", detalhe: respostas.length > 0 ? plural(respostas.length, "resposta") : "Use “Chamar a galera” aqui embaixo", href: "#convite" },
    { feito: jogadores.length > 0 && semNivel === 0, titulo: "Dar o nível de cada jogador", detalhe: semNivel > 0 ? `Faltam ${semNivel}` : "Equilibra o sorteio", href: "/admin/jogadores" },
    { feito: prazoEncerrado(), titulo: `Prazo de confirmação (${EVENTO.prazoTexto})`, detalhe: "Depois dele, sorteie os times", href: "/admin/convidados" },
    { feito: numTimes > 0, titulo: "Sortear os times", detalhe: numTimes > 0 ? plural(numTimes, "time") : "Com os confirmados", href: "/admin/times" },
    { feito: jogos.length > 0, titulo: "Gerar a tabela", detalhe: jogos.length > 0 ? plural(jogos.length, "jogo") : "Formato, campos e horários", href: "/admin/tabela" },
    { feito: config.publicado, titulo: "Publicar no site", detalhe: "Libera /torneio e a TV", href: "/admin/tabela" },
    { feito: jogos.length > 0 && encerrados === jogos.length, titulo: "Jogar!", detalhe: jogos.length > 0 ? `${encerrados} de ${jogos.length} jogos encerrados` : "Controle pelo celular", href: "/admin/jogos" },
    { feito: lances > 0, titulo: "Lances", detalhe: lances > 0 ? plural(lances, "vídeo") : "Links dos replays", href: "/admin/lances" },
  ];
  const proximo = passos.findIndex((p) => !p.feito);

  const idades = new Map<number, number>();
  for (const j of jogadores) idades.set(j.idade, (idades.get(j.idade) ?? 0) + 1);
  const faixa = [...idades.entries()].sort((a, b) => a[0] - b[0]);
  const maior = Math.max(1, ...idades.values());

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-wide">Resumo</h1>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero rotulo="Pessoas confirmadas" valor={sim.adultos + sim.criancas} detalhe={`${plural(sim.adultos, "adulto")} · ${plural(sim.criancas, "criança")}`} destaque />
        <Numero rotulo="Jogadores inscritos" valor={jogadores.length} detalhe={`${plural(jogadoresSim, "confirmado")} · ${plural(jogadores.filter((j) => j.goleiro).length, "goleiro")}`} destaque />
        <Numero rotulo="Talvez" valor={talvez.adultos + talvez.criancas} detalhe={plural(por("TALVEZ").length, "família")} />
        <Numero rotulo="Não vão" valor={por("NAO").length} detalhe={por("NAO").length === 1 ? "família" : "famílias"} />
      </section>

      <section className="cartao p-5">
        <h2 className="font-display text-2xl tracking-wide">Passo a passo</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {passos.map((p, i) => (
            <li key={p.titulo}>
              <Link
                href={p.href}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:bg-campo-800 ${
                  i === proximo ? "border-fla-500 bg-fla-500/10" : "border-campo-700"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    p.feito ? "bg-emerald-500/20 text-emerald-400" : i === proximo ? "bg-fla-500 text-white" : "bg-campo-700 text-zinc-400"
                  }`}
                >
                  {p.feito ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${p.feito ? "text-zinc-400" : ""}`}>{p.titulo}</span>
                  <span className="block truncate text-xs text-zinc-500">{p.detalhe}</span>
                </span>
                {i === proximo && <span className="ml-auto shrink-0 text-xs font-semibold text-fla-400">Agora</span>}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section id="convite" className="cartao scroll-mt-28 p-5">
          <h2 className="font-display text-2xl tracking-wide">Chamar a galera</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Um link só para todo mundo. Mande no grupo ou direto para cada família.
          </p>
          <CompartilharConvite url={publicUrl()} mensagem={mensagemConvite()} />
        </section>

        <section className="cartao p-5">
          <h2 className="font-display text-2xl tracking-wide">Idade dos jogadores</h2>
          {faixa.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">Ninguém inscrito ainda.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {faixa.map(([idade, n]) => (
                <li key={idade} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-zinc-400">{idade} anos</span>
                  <span className="h-5 rounded bg-fla-500" style={{ width: `${(n / maior) * 100}%`, minWidth: "0.5rem" }} />
                  <span className="tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="cartao">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-display text-2xl tracking-wide">Últimas respostas</h2>
          <Link href="/admin/convidados" className="text-sm text-fla-400 hover:underline">
            Ver todas ({respostas.length})
          </Link>
        </div>
        {respostas.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-zinc-400">Ninguém respondeu ainda. Compartilhe o convite!</p>
        ) : (
          <ul className="mt-3 divide-y divide-campo-700">
            {respostas.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/convidados/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-campo-800">
                  <span className="min-w-0 truncate">{r.responsavel}</span>
                  <SeloPresenca presenca={r.presenca} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type Passo = { feito: boolean; titulo: string; detalhe: string; href: string };

const plural = (n: number, palavra: string) => `${n} ${palavra}${n === 1 ? "" : "s"}`;

function Numero(props: { rotulo: string; valor: number; detalhe: string; destaque?: boolean }) {
  return (
    <div className={`cartao p-4 ${props.destaque ? "border-fla-500/50" : ""}`}>
      <p className="text-sm text-zinc-400">{props.rotulo}</p>
      <p className={`font-display mt-1 text-5xl leading-none ${props.destaque ? "text-fla-500" : ""}`}>{props.valor}</p>
      <p className="mt-2 text-xs text-zinc-500">{props.detalhe}</p>
    </div>
  );
}
