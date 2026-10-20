import Link from "next/link";
import { ConfigTabelaForm, Publicar } from "@/components/admin-tabela";
import { CartaoJogo, Chave, NomeTime, TabelaGrupo } from "@/components/torneio-ui";
import type { ConfigTabela } from "@/lib/tabela";
import { carregarTorneio } from "@/lib/torneio";

export const dynamic = "force-dynamic";

export default async function Tabela() {
  const t = await carregarTorneio();
  const { config } = t;
  const inicial: ConfigTabela = {
    formato: config.formato,
    numGrupos: config.numGrupos,
    classificados: config.classificados,
    terceiroLugar: config.terceiroLugar,
    campos: config.campos,
    duracao: config.duracao,
    intervalo: config.intervalo,
    inicio: config.inicio,
  };
  const temTabela = t.jogos.length > 0;
  const jogosGrupo = t.jogos.filter((j) => j.fase === "GRUPOS");
  const jogosMata = t.jogos.filter((j) => j.fase !== "GRUPOS");
  const href = (j: { id: number }) => `/admin/jogos/${j.id}`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-wide">Tabela</h1>

      {t.times.length < 2 ? (
        <p className="cartao p-6 text-zinc-400">
          Primeiro sorteie os times em{" "}
          <Link href="/admin/times" className="text-fla-400 hover:underline">
            Times
          </Link>
          .
        </p>
      ) : (
        <ConfigTabelaForm
          key={temTabela ? "com" : "sem"}
          inicial={inicial}
          numTimes={t.times.length}
          temTabela={temTabela}
          temJogosIniciados={t.jogos.some((j) => j.status !== "AGENDADO")}
        />
      )}

      {(temTabela || t.times.length > 0) && <Publicar publicado={config.publicado} />}

      {Object.keys(t.classificacao).length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl tracking-wide">Grupos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(t.classificacao).map(([g, linhas]) => (
              <TabelaGrupo key={g} grupo={g} linhas={linhas} timePorId={t.timePorId} classificados={config.classificados} />
            ))}
          </div>
        </section>
      )}

      {jogosMata.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl tracking-wide">Mata-mata</h2>
          <Chave jogos={jogosMata} timePorId={t.timePorId} hrefJogo={href} />
        </section>
      )}

      {jogosGrupo.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-3xl tracking-wide">Jogos dos grupos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {jogosGrupo.map((j) => (
              <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} href={href(j)} />
            ))}
          </div>
        </section>
      )}

      {!temTabela && t.times.length >= 2 && (
        <section className="space-y-2">
          <h2 className="font-display text-2xl tracking-wide">Times</h2>
          <ul className="flex flex-wrap gap-3">
            {t.times.map((time) => (
              <li key={time.id} className="cartao px-3 py-2">
                <NomeTime time={time} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
