"use client";

import { useRef, useState } from "react";
import { enviarFoto } from "@/app/actions";
import { reduzirFoto } from "@/lib/reduzir-foto";
import { Avatar } from "./avatar";

/** Escolher, enviar e trocar a foto de uma criança. Devolve o nome do arquivo por `onChange`. */
export function FotoCrianca({
  nome,
  foto,
  onChange,
  compacto = false,
}: {
  nome: string;
  foto: string | null;
  onChange: (foto: string | null) => void;
  compacto?: boolean;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("foto", await reduzirFoto(arquivo), "foto.jpg");
      const r = await enviarFoto(form);
      if (r.ok) onChange(r.foto);
      else setErro(r.erro);
    } catch {
      setErro("Não deu para usar essa foto. Tente outra.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        aria-label={foto ? `Trocar a foto de ${nome || "criança"}` : `Adicionar foto de ${nome || "criança"}`}
        className={`relative shrink-0 rounded-full ${enviando ? "animate-pulse" : ""}`}
      >
        {foto ? (
          <Avatar nome={nome || "Criança"} foto={foto} cor="#e10600" className={compacto ? "size-10" : "size-14"} />
        ) : (
          <span
            className={`flex items-center justify-center rounded-full border-2 border-dashed border-campo-600 text-xl text-zinc-500 ${
              compacto ? "size-10" : "size-14"
            }`}
          >
            📷
          </span>
        )}
      </button>
      {!compacto && (
        <div className="min-w-0 text-sm">
          <button type="button" onClick={() => entrada.current?.click()} disabled={enviando} className="font-medium text-zinc-200 hover:text-white">
            {enviando ? "Enviando…" : foto ? "Trocar foto" : "Foto para a escalação"}
          </button>
          {foto && !enviando && (
            <button type="button" onClick={() => onChange(null)} className="ml-3 text-zinc-500 hover:text-fla-400">
              Tirar foto
            </button>
          )}
          <p className="text-xs text-zinc-500">Opcional. Aparece na escalação do site e na TV do campo.</p>
          {erro && <p className="erro">{erro}</p>}
        </div>
      )}
      <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={escolher} />
    </div>
  );
}
