import Link from "next/link";
import { notFound } from "next/navigation";
import { ControleJogo } from "@/components/controle-jogo";
import { rotuloJogo } from "@/components/torneio-ui";
import { rotuloFonte } from "@/lib/tabela";
import { carregarTorneio } from "@/lib/torneio";

export const dynamic = "force-dynamic";

export default async function Jogo({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const t = await carregarTorneio();
  const jogo = t.jogos.find((j) => j.id === id);
  if (!jogo) notFound();

  const lado = (timeId: number | null, fonte: string | null) => {
    const time = timeId ? t.timePorId.get(timeId) : undefined;
    return time
      ? { id: time.id, nome: time.nome, cor: time.cor, jogadores: time.jogadores.map((j) => ({ id: j.id, nome: j.nome })) }
      : { id: null, nome: rotuloFonte(fonte), cor: "#3f3f46", jogadores: [] };
  };

  // O próximo da fila: o primeiro jogo ainda não encerrado depois deste.
  const proximo = t.jogos.find((j) => j.numero > jogo.numero && j.status !== "ENCERRADO");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <Link href="/admin/jogos" className="text-zinc-400 hover:text-white">
          ← Jogos
        </Link>
        {proximo && (
          <Link href={`/admin/jogos/${proximo.id}`} className="text-zinc-400 hover:text-white">
            Próximo: Jogo {proximo.numero} →
          </Link>
        )}
      </div>
      <p className="text-sm text-zinc-400">
        Jogo {jogo.numero} · {jogo.horario} · Campo {jogo.campo} · {rotuloJogo(jogo)}
      </p>
      <ControleJogo
        jogo={{
          id: jogo.id,
          status: jogo.status,
          mataMata: jogo.fase !== "GRUPOS",
          iniciadoEm: jogo.iniciadoEm?.toISOString() ?? null,
          golsA: jogo.golsA,
          golsB: jogo.golsB,
          penaltisA: jogo.penaltisA,
          penaltisB: jogo.penaltisB,
          gols: jogo.gols.map((g) => ({
            id: g.id,
            timeId: g.timeId,
            autor: g.crianca?.nome ?? null,
            contra: g.contra,
            em: g.criadoEm.toISOString(),
          })),
        }}
        timeA={lado(jogo.timeAId, jogo.fonteA)}
        timeB={lado(jogo.timeBId, jogo.fonteB)}
        duracao={t.config.duracao}
      />
    </div>
  );
}
