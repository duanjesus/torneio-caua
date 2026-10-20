import Image from "next/image";
import Link from "next/link";
import { AvisoEquipamento } from "@/components/aviso-equipamento";
import { Contagem } from "@/components/contagem";
import { IconeCalendario, IconeCopo, IconeLocal, IconeRelogio } from "@/components/icones";
import { JaRespondi } from "@/components/ja-respondi";
import { EVENTO, agendaUrl, mapaUrl, prazoEncerrado } from "@/lib/evento";

// Página estática, refeita de hora em hora para o aviso de prazo virar sozinho.
export const revalidate = 3600;

export default function Convite() {
  const encerrado = prazoEncerrado();
  return (
    <main className="riscos min-h-screen pb-36">
      <div className="mx-auto max-w-md">
        <h1 className="sr-only">
          Você foi convocado! {EVENTO.titulo}, {EVENTO.idade} anos
        </h1>
        <Image
          src="/convite.jpg"
          alt={`Convite: Você foi convocado! ${EVENTO.titulo}, ${EVENTO.idade} anos. ${EVENTO.dataCurta}, ${EVENTO.horario}, ${EVENTO.local}, ${EVENTO.endereco}.`}
          width={1024}
          height={1536}
          priority
          className="h-auto w-full sm:mt-6 sm:rounded-2xl"
        />

        <div className="space-y-4 px-4 pt-4">
          <Contagem inicio={`${EVENTO.data}T${EVENTO.inicio}:00-03:00`} fim={`${EVENTO.data}T${EVENTO.fim}:00-03:00`} />
          <JaRespondi />

          <section className="cartao overflow-hidden" aria-label="Quando e onde">
            <ul className="divide-y divide-campo-700">
              <Linha icone={<IconeCalendario />} titulo={`${EVENTO.diaSemana}, ${EVENTO.dataCurta}`} detalhe="Aniversário de 8 anos do Cauã" />
              <Linha icone={<IconeRelogio />} titulo={EVENTO.horario} detalhe="Torneio e festa" />
              <Linha icone={<IconeLocal />} titulo={EVENTO.local} detalhe={EVENTO.endereco} />
              <Linha icone={<IconeCopo />} titulo="Bar no campo" detalhe="Bebidas à venda no local" />
            </ul>
            <div className="grid grid-cols-2 gap-px border-t border-campo-700 bg-campo-700">
              <a href={agendaUrl()} target="_blank" rel="noreferrer" className="bg-campo-900 py-3 text-center text-sm font-semibold hover:bg-campo-800">
                Salvar na agenda
              </a>
              <a href={mapaUrl} target="_blank" rel="noreferrer" className="bg-campo-900 py-3 text-center text-sm font-semibold hover:bg-campo-800">
                Como chegar
              </a>
            </div>
          </section>

          <AvisoEquipamento grande />

          <section className="cartao p-5">
            <h2 className="font-display text-2xl tracking-wide text-fla-500">Como funciona</h2>
            <ol className="mt-3 space-y-3 text-zinc-300">
              <Passo n={1}>Confirme quem da sua família vem para a festa.</Passo>
              <Passo n={2}>
                Marque as crianças que vão <strong className="text-white">entrar em campo</strong> e, se quiser, mande uma foto
                delas para a escalação.
              </Passo>
              <Passo n={3}>
                No dia, os times, a tabela, os placares e os lances aparecem{" "}
                <Link href="/torneio" className="font-medium text-fla-400 underline-offset-2 hover:underline">
                  na página do torneio
                </Link>
                , ao vivo.
              </Passo>
            </ol>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-campo-700 bg-campo-950/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto max-w-md">
          <p className={`mb-2 text-center text-xs ${encerrado ? "text-zinc-400" : "text-zinc-300"}`}>
            {encerrado ? (
              <>O prazo acabou ({EVENTO.prazoTexto}), mas ainda dá para avisar.</>
            ) : (
              <>
                Confirme até <strong className="text-white">{EVENTO.prazoTexto}</strong>
              </>
            )}
          </p>
          <Link href="/confirmar" className="btn-primario w-full text-lg">
            Confirmar presença
          </Link>
        </div>
      </div>
    </main>
  );
}

function Linha({ icone, titulo, detalhe }: { icone: React.ReactNode; titulo: string; detalhe: string }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fla-500/15 text-fla-400">{icone}</span>
      <span className="min-w-0">
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-sm text-zinc-400">{detalhe}</span>
      </span>
    </li>
  );
}

function Passo({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full bg-fla-500 text-lg leading-none text-white">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
