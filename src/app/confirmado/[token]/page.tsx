import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisoEquipamento } from "@/components/aviso-equipamento";
import { Avatar } from "@/components/avatar";
import { SalvarToken } from "@/components/salvar-token";
import { EVENTO, agendaUrl, mapaUrl } from "@/lib/evento";
import { buscarPorToken } from "@/lib/respostas";

export const metadata = { title: `Sua resposta · ${EVENTO.titulo}`, robots: { index: false } };

const CABECALHO = {
  SIM: { titulo: "Tá convocado!", texto: `Te esperamos no ${EVENTO.local}. Vai ser um golaço!` },
  TALVEZ: { titulo: "Anotado!", texto: "Quando tiver certeza, é só voltar aqui e atualizar a resposta." },
  NAO: { titulo: "Que pena!", texto: `Obrigado por avisar. O ${EVENTO.aniversariante} vai sentir sua falta.` },
} as const;

export default async function Confirmado({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await buscarPorToken(token);
  if (!r) notFound();

  const cab = CABECALHO[r.presenca];
  const jogadores = r.criancas.filter((c) => c.joga);
  const vem = r.presenca !== "NAO";

  return (
    <main className="riscos min-h-screen">
      <SalvarToken token={r.token} />
      <div className="mx-auto max-w-xl space-y-5 px-4 pb-16 pt-8">
        <div className="text-center">
          <Image src="/escudo.jpg" alt="" width={140} height={140} className="mx-auto size-32 rounded-2xl" />
          <h1 className="titulo-pincel mt-4 text-6xl leading-none text-fla-500">{cab.titulo}</h1>
          <p className="mt-3 text-zinc-300">{cab.texto}</p>
        </div>

        <section className="cartao divide-y divide-campo-700">
          <Linha rotulo="Responsável">{r.responsavel}</Linha>
          {vem && (
            <Linha rotulo="Vêm">
              {r.adultos} {r.adultos === 1 ? "adulto" : "adultos"}
              {r.criancas.length > 0 &&
                ` e ${r.criancas.length} ${r.criancas.length === 1 ? "criança" : "crianças"}`}
            </Linha>
          )}
          {vem && r.criancas.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-sm text-zinc-400">Crianças</p>
              <ul className="mt-2 space-y-2">
                {r.criancas.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-3">
                      {c.joga && <Avatar nome={c.nome} foto={c.foto} cor="#e10600" className="size-9" textoClassName="text-xs" />}
                      <span>
                        {c.nome} <span className="text-zinc-500">· {c.idade} anos</span>
                      </span>
                    </span>
                    {c.joga && (
                      <span className="shrink-0 rounded-full bg-fla-500/15 px-2.5 py-1 text-xs font-medium text-fla-400">
                        {c.goleiro ? "⚽ joga · 🧤 goleiro" : "⚽ joga"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {r.recado && <Linha rotulo="Recado">“{r.recado}”</Linha>}
        </section>

        {jogadores.length > 0 && (
          <p className="cartao border-fla-500/40 p-4 text-sm text-zinc-300">
            <strong className="text-white">
              {jogadores.length === 1 ? "1 criança inscrita" : `${jogadores.length} crianças inscritas`}
            </strong>{" "}
            no torneio. Os times são sorteados antes da festa e aparecem{" "}
            <Link href="/torneio" className="text-fla-400 hover:underline">
              na página do torneio
            </Link>
            .
          </p>
        )}
        {jogadores.length > 0 && <AvisoEquipamento />}

        <div className="grid gap-2 sm:grid-cols-2">
          {vem && (
            <>
              <a href={agendaUrl()} target="_blank" rel="noreferrer" className="btn-secundario">
                Adicionar à agenda
              </a>
              <a href={mapaUrl} target="_blank" rel="noreferrer" className="btn-secundario">
                Abrir no mapa
              </a>
            </>
          )}
          <Link href={`/confirmar?t=${r.token}`} className="btn-secundario sm:col-span-2">
            Mudar minha resposta
          </Link>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Guarde este link para mudar a resposta depois. Neste celular ele já fica salvo no convite.
        </p>
      </div>
    </main>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-5 py-4">
      <span className="text-sm text-zinc-400">{rotulo}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
