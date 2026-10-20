import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioResposta } from "@/components/formulario-resposta";
import { EVENTO } from "@/lib/evento";
import { buscarPorToken, paraFormulario } from "@/lib/respostas";
import { responderConvite } from "../actions";

export const metadata = { title: `Confirmar presença · ${EVENTO.titulo}` };

export default async function Confirmar({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const existente = t ? await buscarPorToken(t) : null;
  if (t && !existente) notFound();

  const acao = responderConvite.bind(null, existente?.token ?? null);

  return (
    <main className="riscos min-h-screen">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar ao convite
        </Link>
        <header className="mt-4 flex items-center gap-4">
          <Image src="/escudo.jpg" alt="" width={88} height={88} className="size-20 shrink-0 rounded-xl" />
          <div>
            <p className="font-display text-lg tracking-widest text-zinc-400">
              {EVENTO.diaSemana} {EVENTO.dataCurta} · {EVENTO.horario}
            </p>
            <h1 className="titulo-pincel text-5xl leading-none text-white">
              {existente ? "Editar resposta" : "Confirme presença"}
            </h1>
          </div>
        </header>

        <div className="mt-8">
          <FormularioResposta
            acao={acao}
            inicial={existente ? paraFormulario(existente) : undefined}
            textoBotao={existente ? "Salvar alterações" : "Enviar resposta"}
          />
        </div>
      </div>
    </main>
  );
}
