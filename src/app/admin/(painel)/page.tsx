import Link from "next/link";
import { CompartilharConvite } from "@/components/compartilhar-convite";
import { SeloPresenca } from "@/components/selo-presenca";
import { db } from "@/lib/db";
import { mensagemConvite, publicUrl } from "@/lib/evento";

export const dynamic = "force-dynamic";

export default async function Resumo() {
  const respostas = await db.resposta.findMany({
    include: { criancas: true },
    orderBy: { atualizadoEm: "desc" },
  });

  const por = (p: string) => respostas.filter((r) => r.presenca === p);
  const pessoas = (lista: typeof respostas) => ({
    adultos: lista.reduce((s, r) => s + r.adultos, 0),
    criancas: lista.reduce((s, r) => s + r.criancas.length, 0),
  });
  const sim = pessoas(por("SIM"));
  const talvez = pessoas(por("TALVEZ"));
  const jogadores = respostas.flatMap((r) => r.criancas.filter((c) => c.joga).map((c) => ({ ...c, presenca: r.presenca })));
  const jogadoresSim = jogadores.filter((j) => j.presenca === "SIM").length;

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

      <div className="grid gap-6 md:grid-cols-2">
        <section className="cartao p-5">
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
