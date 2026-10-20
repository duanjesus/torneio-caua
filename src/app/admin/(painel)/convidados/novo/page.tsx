import Link from "next/link";
import { FormularioResposta } from "@/components/formulario-resposta";
import { salvarConvidado } from "../../../actions";

export default function NovoConvidado() {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/convidados" className="text-sm text-zinc-400 hover:text-white">
        ← Convidados
      </Link>
      <h1 className="font-display mt-2 text-4xl tracking-wide">Adicionar convidado</h1>
      <p className="mt-1 text-sm text-zinc-400">Para quem confirmou por mensagem ou pessoalmente.</p>
      <div className="mt-6">
        <FormularioResposta modo="admin" acao={salvarConvidado.bind(null, null)} textoBotao="Adicionar" />
      </div>
    </div>
  );
}
