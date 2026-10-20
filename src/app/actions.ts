"use server";

import { revalidatePath } from "next/cache";
import type { RetornoAcao } from "@/components/formulario-resposta";
import { db } from "@/lib/db";
import { validarResposta } from "@/lib/resposta";
import { gravarResposta } from "@/lib/respostas";

/** Resposta do convidado pelo link geral. Com `token`, edita a resposta já enviada. */
export async function responderConvite(token: string | null, dados: unknown): Promise<RetornoAcao> {
  // Robôs preenchem o campo escondido; finge que deu certo e não grava nada.
  if (dados && typeof dados === "object" && (dados as { site?: unknown }).site) {
    return { ok: true, destino: "/" };
  }

  const r = validarResposta(dados);
  if (!r.ok) return r;

  let respostaId: number | undefined;
  if (token) {
    const existente = await db.resposta.findUnique({ where: { token }, select: { id: true } });
    if (!existente) return { ok: false, erros: { geral: "Resposta não encontrada." } };
    respostaId = existente.id;
  }

  const salvo = await gravarResposta(r.valor, { respostaId });
  revalidatePath("/admin", "layout");
  return { ok: true, destino: `/confirmado/${salvo.token}` };
}
