import Image from "next/image";
import Link from "next/link";
import { AtualizarSozinho } from "@/components/atualizar-sozinho";
import { MeioCampo } from "@/components/escalacao";
import { Artilharia, CartaoJogo, Chave, CorTime, TabelaGrupo } from "@/components/torneio-ui";
import { db } from "@/lib/db";
import { EVENTO } from "@/lib/evento";
import { nomePublico } from "@/lib/resposta";
import { carregarTorneio } from "@/lib/torneio";

export const dynamic = "force-dynamic";
export const metadata = { title: `Ao vivo · ${EVENTO.titulo}` };

export default async function TorneioPublico() {
  const t = await carregarTorneio();

  if (!t.config.publicado) {
    const inscritos = await db.crianca.count({ where: { joga: true, resposta: { presenca: "SIM" } } });
    return (
      <main className="riscos flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
        <AtualizarSozinho segundos={30} />
        <Image src="/escudo.jpg" alt="" width={160} height={160} className="size-36 rounded-2xl" />
        <h1 className="titulo-pincel text-6xl leading-none text-fla-500">Em breve</h1>
        <p className="max-w-sm text-zinc-300">
          Os times e a tabela do {EVENTO.titulo} aparecem aqui no dia. Já são{" "}
          <strong className="text-white">{inscritos} craques inscritos</strong>.
        </p>
        <Link href="/" className="btn-secundario">
          Ver o convite
        </Link>
      </main>
    );
  }

  const aoVivo = t.jogos.filter((j) => j.status === "AO_VIVO");
  const proximos = t.jogos.filter((j) => j.status === "AGENDADO").slice(0, 4);
  const encerrados = t.jogos.filter((j) => j.status === "ENCERRADO").reverse();
  const mataMata = t.jogos.filter((j) => j.fase !== "GRUPOS");
  const campeao = t.campeaoId ? t.timePorId.get(t.campeaoId) : null;

  return (
    <main className="riscos min-h-screen">
      <AtualizarSozinho segundos={10} />
      <header className="border-b border-campo-700 bg-campo-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Image src="/escudo.jpg" alt="" width={48} height={48} className="size-12 rounded-lg" />
          <div className="min-w-0">
            <h1 className="font-display truncate text-3xl leading-none tracking-wide">
              <span className="text-fla-500">Torneio</span> do {EVENTO.aniversariante}
            </h1>
            <p className="text-xs text-zinc-400">Atualiza sozinho · {EVENTO.local}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        {campeao && (
          <section className="cartao relative overflow-hidden border-fla-500 p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: campeao.cor }} />
            <p className="font-display text-2xl tracking-widest text-zinc-400">👑 Campeão 👑</p>
            <p className="titulo-pincel mt-1 text-6xl leading-none text-fla-500">{campeao.nome}</p>
            <p className="mt-3 text-sm text-zinc-300">{campeao.jogadores.map((j) => nomePublico(j.nome)).join(" · ")}</p>
          </section>
        )}

        {aoVivo.length > 0 && (
          <Secao titulo="Ao vivo" destaque>
            <div className="grid gap-3 md:grid-cols-2">
              {aoVivo.map((j) => (
                <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} />
              ))}
            </div>
          </Secao>
        )}

        {proximos.length > 0 && (
          <Secao titulo="Próximos jogos">
            <div className="grid gap-3 md:grid-cols-2">
              {proximos.map((j) => (
                <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} />
              ))}
            </div>
          </Secao>
        )}

        {Object.keys(t.classificacao).length > 0 && (
          <Secao titulo="Classificação">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(t.classificacao).map(([g, linhas]) => (
                <TabelaGrupo key={g} grupo={g} linhas={linhas} timePorId={t.timePorId} classificados={t.config.classificados} />
              ))}
            </div>
          </Secao>
        )}

        {mataMata.length > 0 && (
          <Secao titulo="Mata-mata">
            <Chave jogos={mataMata} timePorId={t.timePorId} />
          </Secao>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <Secao titulo="Artilharia">
            <div className="cartao p-4">
              <Artilharia artilharia={t.artilharia} timePorId={t.timePorId} nome={nomePublico} />
            </div>
          </Secao>

          {encerrados.length > 0 && (
            <Secao titulo="Resultados">
              <div className="space-y-3">
                {encerrados.map((j) => (
                  <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} compacto />
                ))}
              </div>
            </Secao>
          )}
        </div>

        <Secao titulo="Escalações">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.times.map((time) => (
              <div key={time.id} className="cartao overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: time.cor }} />
                <div className="space-y-3 p-3">
                  <h3 className="flex items-center gap-2 px-1 font-semibold">
                    <CorTime cor={time.cor} />
                    {time.nome}
                    {time.grupo && <span className="ml-auto text-xs font-normal text-zinc-500">Grupo {time.grupo}</span>}
                  </h3>
                  <MeioCampo time={time} />
                </div>
              </div>
            ))}
          </div>
        </Secao>
      </div>
    </main>
  );
}

function Secao({ titulo, destaque, children }: { titulo: string; destaque?: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className={`font-display text-3xl tracking-wide ${destaque ? "text-fla-500" : ""}`}>{titulo}</h2>
      {children}
    </section>
  );
}
