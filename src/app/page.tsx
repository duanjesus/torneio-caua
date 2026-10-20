import Image from "next/image";
import Link from "next/link";
import { AvisoEquipamento } from "@/components/aviso-equipamento";
import { JaRespondi } from "@/components/ja-respondi";
import { EVENTO, agendaUrl, mapaUrl, prazoEncerrado } from "@/lib/evento";

// Página estática, refeita de hora em hora para o aviso de prazo virar sozinho.
export const revalidate = 3600;

export default function Convite() {
  const encerrado = prazoEncerrado();
  return (
    <main className="riscos min-h-screen pb-28">
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

        <div className="space-y-4 px-4 pt-5">
          <JaRespondi />

          <p
            className={`rounded-2xl border px-4 py-3 text-center ${
              encerrado ? "border-campo-600 bg-campo-900 text-zinc-300" : "border-fla-500/60 bg-fla-500/10 text-white"
            }`}
          >
            {encerrado ? (
              <>O prazo de confirmação acabou ({EVENTO.prazoTexto}), mas ainda dá para avisar se você vem.</>
            ) : (
              <>
                Confirme até <strong className="font-display text-xl tracking-wide text-fla-400">{EVENTO.prazoTexto}</strong>
              </>
            )}
          </p>

          <section className="grid gap-3">
            <Info titulo="Quando">
              <p className="text-lg font-semibold">
                {EVENTO.diaSemana}, {EVENTO.dataCurta}
              </p>
              <p className="text-zinc-400">{EVENTO.horario}</p>
              <a href={agendaUrl()} target="_blank" rel="noreferrer" className="btn-pequeno mt-3">
                Adicionar à agenda
              </a>
            </Info>
            <Info titulo="Onde">
              <p className="text-lg font-semibold">{EVENTO.local}</p>
              <p className="text-zinc-400">{EVENTO.endereco}</p>
              <a href={mapaUrl} target="_blank" rel="noreferrer" className="btn-pequeno mt-3">
                Abrir no mapa
              </a>
            </Info>
          </section>

          <AvisoEquipamento grande />

          <section className="cartao p-5">
            <h2 className="font-display text-2xl tracking-wide text-fla-500">Como funciona</h2>
            <ol className="mt-3 space-y-3 text-zinc-300">
              <Passo n={1}>Confirme quem da sua família vem para a festa.</Passo>
              <Passo n={2}>
                Marque as crianças que vão <strong className="text-white">entrar em campo</strong>: elas ficam
                inscritas no torneio.
              </Passo>
              <Passo n={3}>
                No dia, os times, a tabela e os placares aparecem{" "}
                <Link href="/torneio" className="font-medium text-fla-400 underline-offset-2 hover:underline">
                  na página do torneio
                </Link>
                , ao vivo.
              </Passo>
            </ol>
          </section>

          <p className="px-1 text-center text-sm text-zinc-500">{EVENTO.aviso}</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-campo-700 bg-campo-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Link href="/confirmar" className="btn-primario w-full text-lg">
            Confirmar presença
          </Link>
        </div>
      </div>
    </main>
  );
}

function Info({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="cartao p-5">
      <h2 className="font-display text-xl tracking-wider text-fla-500">{titulo}</h2>
      <div className="mt-1">{children}</div>
    </div>
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
