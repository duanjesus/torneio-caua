import { db } from "./db";
import { nomePublico } from "./resposta";
import { analisarVideo, type Video } from "./video";

export type LanceView = {
  id: number;
  url: string;
  video: Video;
  titulo: string;
  subtitulo: string | null;
  cor: string | null;
  jogoId: number | null;
  criadoEm: Date;
};

/** Lances do mais novo para o mais antigo, com título montado a partir do gol ou do jogo. */
export async function carregarLances(): Promise<LanceView[]> {
  const lances = await db.lance.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      gol: { include: { crianca: { select: { nome: true } }, time: { select: { nome: true, cor: true } } } },
      jogo: {
        select: {
          id: true,
          numero: true,
          timeA: { select: { nome: true } },
          timeB: { select: { nome: true } },
        },
      },
    },
  });

  return lances.flatMap((l) => {
    const video = analisarVideo(l.url);
    if (!video) return [];
    let titulo = "Lance";
    if (l.gol) {
      const autor = l.gol.crianca ? nomePublico(l.gol.crianca.nome) : null;
      titulo = l.gol.contra ? `Gol contra a favor do ${l.gol.time.nome}` : autor ? `Gol de ${autor}` : `Gol do ${l.gol.time.nome}`;
    } else if (l.jogo) {
      titulo = `Lance do Jogo ${l.jogo.numero}`;
    }
    const confronto = l.jogo
      ? `Jogo ${l.jogo.numero} · ${l.jogo.timeA?.nome ?? "?"} x ${l.jogo.timeB?.nome ?? "?"}`
      : null;
    return [
      {
        id: l.id,
        url: l.url,
        video,
        titulo: l.titulo ?? titulo,
        subtitulo: confronto,
        cor: l.gol?.time.cor ?? null,
        jogoId: l.jogo?.id ?? null,
        criadoEm: l.criadoEm,
      },
    ];
  });
}
