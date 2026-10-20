import Link from "next/link";
import { LinhaJogador } from "@/components/linha-jogador";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const plural = (n: number, palavra: string) => `${n} ${palavra}${n === 1 ? "" : "s"}`;

export default async function Jogadores() {
  const jogadores = await db.crianca.findMany({
    where: { joga: true, resposta: { presenca: { in: ["SIM", "TALVEZ"] } } },
    include: { resposta: { select: { id: true, responsavel: true, presenca: true } } },
    orderBy: [{ idade: "asc" }, { nome: "asc" }],
  });

  const confirmados = jogadores.filter((j) => j.resposta.presenca === "SIM").length;
  const semNivel = jogadores.filter((j) => j.nivel === null).length;
  const goleiros = jogadores.filter((j) => j.goleiro).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Jogadores</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {plural(jogadores.length, "inscrito")} · {plural(confirmados, "confirmado")} ·{" "}
          {jogadores.length - confirmados} talvez · {plural(goleiros, "goleiro")}
        </p>
      </div>

      <p className="cartao p-4 text-sm text-zinc-300">
        O <strong className="text-white">nível</strong> (1 a 3) só você vê. Ele serve para equilibrar os times no sorteio:
        1 = começando, 2 = joga bem, 3 = craque.
        {semNivel > 0 && <span className="text-amber-400"> Faltam {semNivel} sem nível.</span>}
      </p>

      {jogadores.length === 0 ? (
        <p className="cartao p-6 text-center text-zinc-400">
          Nenhuma criança inscrita ainda. Elas aparecem aqui quando a família marca “vai jogar”.{" "}
          <Link href="/admin/convidados/novo" className="text-fla-400 hover:underline">
            Adicionar na mão
          </Link>
        </p>
      ) : (
        <ul className="cartao divide-y divide-campo-700">
          {jogadores.map((j) => (
            <LinhaJogador
              key={j.id}
              id={j.id}
              nome={j.nome}
              idade={j.idade}
              nivel={j.nivel}
              goleiro={j.goleiro}
              talvez={j.resposta.presenca === "TALVEZ"}
              responsavel={j.resposta.responsavel}
              respostaId={j.resposta.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
