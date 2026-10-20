"use client";

import { useState } from "react";

export function CompartilharConvite({ url, mensagem }: { url: string; mensagem: string }) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(texto: string, qual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setCopiado("erro");
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <input readOnly value={url} className="campo py-2 text-sm" aria-label="Link do convite" onFocus={(e) => e.target.select()} />
        <button type="button" onClick={() => copiar(url, "link")} className="btn-pequeno shrink-0">
          {copiado === "link" ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-campo-700 bg-campo-950 p-3 font-sans text-sm text-zinc-300">
        {mensagem}
      </pre>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primario text-sm"
        >
          Enviar no WhatsApp
        </a>
        <button type="button" onClick={() => copiar(mensagem, "msg")} className="btn-secundario text-sm">
          {copiado === "msg" ? "Copiada!" : "Copiar mensagem"}
        </button>
      </div>
      {copiado === "erro" && <p className="erro">Não deu para copiar; selecione e copie na mão.</p>}
    </div>
  );
}
