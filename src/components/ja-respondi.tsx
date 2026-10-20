"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { lerTokenSalvo } from "@/lib/token-local";

const nada = () => () => {};

/** Quem já respondeu neste celular vê o atalho para a própria resposta. */
export function JaRespondi() {
  const token = useSyncExternalStore(nada, lerTokenSalvo, () => null);
  if (!token) return null;
  return (
    <div className="cartao flex items-center justify-between gap-3 border-fla-500/40 p-4">
      <p className="text-sm text-zinc-300">Você já respondeu este convite.</p>
      <Link href={`/confirmado/${token}`} className="btn-pequeno shrink-0">
        Ver minha resposta
      </Link>
    </div>
  );
}
