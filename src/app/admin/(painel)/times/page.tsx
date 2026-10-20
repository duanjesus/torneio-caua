import { CartaoTime, LinhaJogadorTime, SorteioTimes } from "@/components/admin-times";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Times() {
  const [times, semTime, confirmados, jogos] = await Promise.all([
    db.time.findMany({
      orderBy: { ordem: "asc" },
      include: {
        jogadores: {
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, idade: true, goleiro: true, nivel: true },
        },
      },
    }),
    db.crianca.findMany({
      where: { joga: true, timeId: null, resposta: { presenca: { in: ["SIM", "TALVEZ"] } } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, idade: true, goleiro: true, nivel: true, resposta: { select: { presenca: true } } },
    }),
    db.crianca.count({ where: { joga: true, resposta: { presenca: "SIM" } } }),
    db.jogo.count(),
  ]);

  const opcoes = times.map(({ id, nome, cor }) => ({ id, nome, cor }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Times</h1>
        <p className="mt-1 text-sm text-zinc-400">Só você vê esta página. Os times aparecem no site quando você publicar na Tabela.</p>
      </div>

      <SorteioTimes jogadores={confirmados} timesAtuais={times.length} temTabela={jogos > 0} />

      {semTime.length > 0 && (
        <section className="cartao border-amber-500/40 p-4">
          <h2 className="font-display text-2xl tracking-wide text-amber-400">Sem time ({semTime.length})</h2>
          <p className="text-sm text-zinc-400">
            Inscritos que ficaram fora do sorteio (confirmaram depois ou marcaram “talvez”).
          </p>
          <ul className="mt-2 divide-y divide-campo-700">
            {semTime.map(({ resposta, ...j }) => (
              <LinhaJogadorTime
                key={j.id}
                jogador={{ ...j, nome: resposta.presenca === "TALVEZ" ? `${j.nome} (talvez)` : j.nome }}
                timeAtual={null}
                opcoes={opcoes}
              />
            ))}
          </ul>
          {times.length === 0 && <p className="mt-2 text-sm text-zinc-500">Sorteie os times primeiro.</p>}
        </section>
      )}

      {times.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {times.map((t) => (
            <CartaoTime
              key={t.id}
              time={{ id: t.id, nome: t.nome, cor: t.cor }}
              jogadores={t.jogadores}
              outros={opcoes.filter((o) => o.id !== t.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
