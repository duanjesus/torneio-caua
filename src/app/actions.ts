"use server";

import { revalidatePath } from "next/cache";
import type { RetornoAcao } from "@/components/formulario-resposta";
import { db } from "@/lib/db";
import { TAMANHO_MAXIMO, salvarFoto } from "@/lib/fotos";
import { validarResposta } from "@/lib/resposta";
import { gravarResposta } from "@/lib/respostas";

/** Recebe a foto (já reduzida no celular) e devolve o nome do arquivo para ir junto com a resposta. */
export async function enviarFoto(form: FormData): Promise<{ ok: true; foto: string } | { ok: false; erro: string }> {
  const arquivo = form.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { ok: false, erro: "Escolha uma foto." };
  if (arquivo.size > TAMANHO_MAXIMO) return { ok: false, erro: "Foto grande demais." };
  const foto = await salvarFoto(new Uint8Array(await arquivo.arrayBuffer()));
  if (!foto) return { ok: false, erro: "Esse arquivo não é uma foto." };
  return { ok: true, foto };
}

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
