"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RetornoAcao } from "@/components/formulario-resposta";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { nomeFotoValido, validarResposta } from "@/lib/resposta";
import { gravarResposta } from "@/lib/respostas";

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const senha = String(form.get("senha") ?? "");
  if (!checkPassword(senha)) return "Senha incorreta.";
  await createSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/** Admin cadastra ou edita uma resposta (quem confirmou por fora do link). */
export async function salvarConvidado(respostaId: number | null, dados: unknown): Promise<RetornoAcao> {
  await requireAdmin();
  const r = validarResposta(dados, { exigirTelefone: false });
  if (!r.ok) return r;

  if (respostaId !== null) {
    const existe = await db.resposta.count({ where: { id: respostaId } });
    if (!existe) return { ok: false, erros: { geral: "Esse convidado foi excluído." } };
  }
  await gravarResposta(r.valor, { respostaId: respostaId ?? undefined, criadoPeloAdmin: respostaId === null });
  revalidatePath("/admin", "layout");
  return { ok: true, destino: "/admin/convidados" };
}

export async function excluirConvidado(respostaId: number): Promise<void> {
  await requireAdmin();
  await db.resposta.deleteMany({ where: { id: respostaId } });
  revalidatePath("/admin", "layout");
  redirect("/admin/convidados");
}

export async function atualizarJogador(criancaId: number, campos: { nivel?: number | null; goleiro?: boolean }) {
  await requireAdmin();
  const data: { nivel?: number | null; goleiro?: boolean } = {};
  if (campos.nivel === null || (Number.isInteger(campos.nivel) && campos.nivel! >= 1 && campos.nivel! <= 3)) {
    data.nivel = campos.nivel;
  }
  if (typeof campos.goleiro === "boolean") data.goleiro = campos.goleiro;
  await db.crianca.updateMany({ where: { id: criancaId, joga: true }, data });
  revalidatePath("/admin", "layout");
}

/** Registra que o lembrete foi aberto no WhatsApp (ou desfaz, com `enviado = false`). */
export async function marcarLembrete(respostaId: number, tipo: "talvez" | "vespera", enviado = true): Promise<void> {
  await requireAdmin();
  const quando = enviado ? new Date() : null;
  await db.resposta.updateMany({
    where: { id: respostaId },
    data: tipo === "talvez" ? { lembreteTalvezEm: quando } : { lembreteVesperaEm: quando },
  });
  revalidatePath("/admin/lembretes");
}

/** Admin põe ou troca a foto (ex.: quando a família mandou pelo WhatsApp). */
export async function definirFoto(criancaId: number, foto: string | null): Promise<void> {
  await requireAdmin();
  if (foto !== null && !nomeFotoValido(foto)) return;
  await db.crianca.update({ where: { id: criancaId }, data: { foto } });
  revalidatePath("/admin", "layout");
  revalidatePath("/torneio", "layout");
}

export async function tirarDoTorneio(criancaId: number): Promise<void> {
  await requireAdmin();
  await db.crianca.updateMany({ where: { id: criancaId }, data: { joga: false, goleiro: false, timeId: null } });
  revalidatePath("/admin", "layout");
}
