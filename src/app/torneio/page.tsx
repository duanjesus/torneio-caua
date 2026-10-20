import Image from "next/image";
import Link from "next/link";
import { AbasSecao } from "@/components/abas-secao";
import { AtualizarSozinho } from "@/components/atualizar-sozinho";
import { MeioCampo } from "@/components/escalacao";
import { LanceCard } from "@/components/lance-card";
import { PlacarDestaque } from "@/components/placar-destaque";
import { Artilharia, CartaoJogo, Chave, CorTime, TabelaGrupo } from "@/components/torneio-ui";
import { db } from "@/lib/db";
import { EVENTO } from "@/lib/evento";
import { carregarLances } from "@/lib/lances";
import { nomePublico } from "@/lib/resposta";
import { carregarTorneio } from "@/lib/torneio";

export const dynamic = "force-dynamic";
export const metadata = { title: `Ao vivo · ${EVENTO.titulo}` };

export default async function TorneioPublico() {
  const [t, lances] = await Promise.all([carregarTorneio(), carregarLances()]);

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
  const temGrupos = Object.keys(t.classificacao).length > 0;
  const restantes = t.jogos.length - encerrados.length;

  const secoes = [
    { id: "agora", titulo: aoVivo.length > 0 ? "Ao vivo" : "Jogos", mostrar: aoVivo.length + proximos.length + encerrados.length > 0 },
    { id: "lances", titulo: "Lances", mostrar: lances.length > 0 },
    { id: "tabela", titulo: "Tabela", mostrar: temGrupos },
    { id: "chave", titulo: "Mata-mata", mostrar: mataMata.length > 0 },
    { id: "escalacoes", titulo: "Escalações", mostrar: t.times.length > 0 },
    { id: "artilharia", titulo: "Artilharia", mostrar: true },
  ].filter((s) => s.mostrar);

  return (
    <main className="riscos min-h-screen pb-16">
      <AtualizarSozinho segundos={10} />
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
        <Image src="/escudo.jpg" alt="" width={56} height={56} className="size-14 rounded-xl" priority />
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-3xl leading-none tracking-wide">
            <span className="text-fla-500">Torneio</span> do {EVENTO.aniversariante}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {EVENTO.local} ·{" "}
            {campeao ? "Torneio encerrado" : `${encerrados.length} de ${t.jogos.length} jogos · faltam ${restantes}`}
          </p>
        </div>
        {aoVivo.length > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-fla-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> Ao vivo
          </span>
        )}
      </header>

      <AbasSecao secoes={secoes.map(({ id, titulo }) => ({ id, titulo }))} />

      <div className="mx-auto max-w-5xl space-y-10 px-4 pt-6">
        {campeao && (
          <section className="relative overflow-hidden rounded-2xl border border-fla-500 bg-gradient-to-b from-fla-500/15 to-campo-900 p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: campeao.cor }} />
            <p className="font-display text-2xl tracking-widest text-zinc-300">👑 Campeão 👑</p>
            <p className="titulo-pincel mt-1 text-6xl leading-none text-fla-500">{campeao.nome}</p>
            <p className="mt-3 text-sm text-zinc-300">{campeao.jogadores.map((j) => nomePublico(j.nome)).join(" · ")}</p>
          </section>
        )}

        {secoes.some((s) => s.id === "agora") && (
          <Secao id="agora" titulo={aoVivo.length > 0 ? "Ao vivo" : "Jogos"} destaque={aoVivo.length > 0}>
            {aoVivo.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {aoVivo.map((j) => (
                  <PlacarDestaque key={j.id} jogo={j} timePorId={t.timePorId} duracao={t.config.duracao} />
                ))}
              </div>
            )}
            {proximos.length > 0 && (
              <>
                <Subtitulo>Próximos</Subtitulo>
                <div className="grid gap-3 md:grid-cols-2">
                  {proximos.map((j) => (
                    <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} />
                  ))}
                </div>
              </>
            )}
            {encerrados.length > 0 && (
              <>
                <Subtitulo>Resultados</Subtitulo>
                <div className="grid gap-3 md:grid-cols-2">
                  {encerrados.slice(0, 6).map((j) => (
                    <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} compacto />
                  ))}
                </div>
                {encerrados.length > 6 && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">
                      Ver todos os {encerrados.length} resultados
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {encerrados.slice(6).map((j) => (
                        <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} compacto />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </Secao>
        )}

        {lances.length > 0 && (
          <Secao id="lances" titulo="Lances">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lances.map((l) => (
                <LanceCard key={l.id} video={l.video} titulo={l.titulo} subtitulo={l.subtitulo} cor={l.cor} />
              ))}
            </div>
            <p className="text-xs text-zinc-500">Replays: Lance Replay · Campo G18</p>
          </Secao>
        )}

        {temGrupos && (
          <Secao id="tabela" titulo="Tabela">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(t.classificacao).map(([g, linhas]) => (
                <TabelaGrupo key={g} grupo={g} linhas={linhas} timePorId={t.timePorId} classificados={t.config.classificados} />
              ))}
            </div>
            {t.config.classificados > 0 && (
              <p className="text-xs text-zinc-500">
                Os {t.config.classificados === 1 ? "primeiros" : `${t.config.classificados} primeiros`} de cada grupo, em vermelho,
                vão para o mata-mata.
              </p>
            )}
          </Secao>
        )}

        {mataMata.length > 0 && (
          <Secao id="chave" titulo="Mata-mata">
            <Chave jogos={mataMata} timePorId={t.timePorId} />
          </Secao>
        )}

        <Secao id="escalacoes" titulo="Escalações">
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

        <Secao id="artilharia" titulo="Artilharia">
          <div className="cartao p-4 md:max-w-md">
            <Artilharia artilharia={t.artilharia} timePorId={t.timePorId} nome={nomePublico} />
          </div>
        </Secao>
      </div>
    </main>
  );
}

function Secao({ id, titulo, destaque, children }: { id: string; titulo: string; destaque?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 space-y-3">
      <h2 className={`font-display text-3xl tracking-wide ${destaque ? "text-fla-500" : ""}`}>{titulo}</h2>
      {children}
    </section>
  );
}

function Subtitulo({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">{children}</h3>;
}
