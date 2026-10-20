"use client";

import { useOptimistic, useTransition } from "react";
import { marcarLembrete } from "@/app/admin/actions";

/** Abre o WhatsApp com a mensagem pronta e marca a família como lembrada. */
export function BotaoLembrete({
  respostaId,
  tipo,
  href,
  enviadoEm,
}: {
  respostaId: number;
  tipo: "talvez" | "vespera";
  href: string;
  enviadoEm: string | null;
}) {
  const [, iniciar] = useTransition();
  const [enviado, setEnviado] = useOptimistic(enviadoEm !== null);

  const quando = enviadoEm
    ? new Date(enviadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    : null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          iniciar(async () => {
            setEnviado(true);
            await marcarLembrete(respostaId, tipo);
          })
        }
        className={enviado ? "btn-pequeno" : "btn-pequeno border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"}
      >
        {enviado ? "Mandar de novo" : "Enviar no WhatsApp"}
      </a>
      {enviado && (
        <button
          type="button"
          onClick={() =>
            iniciar(async () => {
              setEnviado(false);
              await marcarLembrete(respostaId, tipo, false);
            })
          }
          className="text-xs text-emerald-400 hover:text-zinc-300"
          title="Desmarcar"
        >
          ✓ enviado{quando ? ` ${quando}` : ""}
        </button>
      )}
    </div>
  );
}
