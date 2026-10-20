import { BotaoRemoverLance } from "@/components/botao-remover-lance";
import { FormLance, type JogoOpcao } from "@/components/form-lance";
import { LanceCard } from "@/components/lance-card";
import { db } from "@/lib/db";
import { carregarLances } from "@/lib/lances";
import { nomePublico } from "@/lib/resposta";

export const dynamic = "force-dynamic";

export default async function Lances({ searchParams }: { searchParams: Promise<{ jogo?: string }> }) {
  const { jogo } = await searchParams;
  const [lances, jogos] = await Promise.all([
    carregarLances(),
    db.jogo.findMany({
      orderBy: { numero: "asc" },
      include: {
        timeA: { select: { nome: true } },
        timeB: { select: { nome: true } },
        gols: { orderBy: { criadoEm: "asc" }, include: { crianca: { select: { nome: true } }, time: { select: { nome: true } } } },
      },
    }),
  ]);

  const opcoes: JogoOpcao[] = jogos.map((j) => ({
    id: j.id,
    rotulo: `Jogo ${j.numero} · ${j.timeA?.nome ?? "A definir"} x ${j.timeB?.nome ?? "A definir"}`,
    gols: j.gols.map((g, i) => ({
      id: g.id,
      rotulo: `${i + 1}º gol · ${g.contra ? "contra, " : ""}${g.crianca ? nomePublico(g.crianca.nome) : "sem autor"} (${g.time.nome})`,
    })),
  }));
  const jogoInicial = jogo && opcoes.some((o) => o.id === Number(jogo)) ? Number(jogo) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Lances</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Vídeos dos melhores momentos. Baixe o lance no app do Lance Replay, suba no YouTube como <strong className="text-zinc-200">não listado</strong> e
          cole o link aqui. Se o Lance Replay tiver link de compartilhar, pode colar direto.
        </p>
      </div>

      <FormLance jogos={opcoes} jogoInicial={jogoInicial} />

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-wide">
          No site <span className="text-zinc-500">({lances.length})</span>
        </h2>
        {lances.length === 0 ? (
          <p className="cartao p-6 text-center text-zinc-400">Nenhum lance ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lances.map((l) => (
              <div key={l.id} className="space-y-2">
                <LanceCard video={l.video} titulo={l.titulo} subtitulo={l.subtitulo} cor={l.cor} />
                <BotaoRemoverLance id={l.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
