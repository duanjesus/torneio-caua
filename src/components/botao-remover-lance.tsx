"use client";

import { useTransition } from "react";
import { removerLance } from "@/app/admin/lances-actions";

export function BotaoRemoverLance({ id }: { id: number }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() => confirm("Tirar este lance do site?") && iniciar(() => removerLance(id))}
      className="text-sm text-zinc-500 hover:text-fla-400"
    >
      {pendente ? "Removendo…" : "Remover do site"}
    </button>
  );
}
