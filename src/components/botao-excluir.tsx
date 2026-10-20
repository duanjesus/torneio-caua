"use client";

import { useTransition } from "react";

export function BotaoExcluir({ acao, nome }: { acao: () => Promise<void>; nome: string }) {
  const [excluindo, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={excluindo}
      onClick={() => {
        if (confirm(`Excluir a resposta de ${nome} e as crianças dela? Não dá para desfazer.`)) iniciar(() => acao());
      }}
      className="btn w-full border border-fla-500/40 text-sm text-fla-400 hover:bg-fla-500/10"
    >
      {excluindo ? "Excluindo…" : "Excluir esta resposta"}
    </button>
  );
}
