import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoExcluir } from "@/components/botao-excluir";
import { FormularioResposta } from "@/components/formulario-resposta";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/evento";
import { paraFormulario } from "@/lib/respostas";
import { excluirConvidado, salvarConvidado } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function EditarConvidado({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const r = await db.resposta.findUnique({
    where: { id },
    include: { criancas: { orderBy: { ordem: "asc" } } },
  });
  if (!r) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/convidados" className="text-sm text-zinc-400 hover:text-white">
        ← Convidados
      </Link>
      <h1 className="font-display mt-2 text-4xl tracking-wide">{r.responsavel}</h1>
      <p className="mt-1 break-all text-sm text-zinc-500">
        Link de edição do convidado: {publicUrl()}/confirmar?t={r.token}
      </p>
      <div className="mt-6">
        <FormularioResposta
          modo="admin"
          inicial={paraFormulario(r)}
          acao={salvarConvidado.bind(null, r.id)}
          textoBotao="Salvar alterações"
        />
      </div>
      <div className="mt-10 border-t border-campo-700 pt-6">
        <BotaoExcluir acao={excluirConvidado.bind(null, r.id)} nome={r.responsavel} />
      </div>
    </div>
  );
}
