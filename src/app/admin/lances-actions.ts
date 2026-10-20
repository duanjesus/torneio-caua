"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { analisarVideo } from "@/lib/video";

export type RetornoLance = { ok: true } | { ok: false; erro: string };

function revalidar() {
  revalidatePath("/admin", "layout");
  revalidatePath("/torneio", "layout");
}

export async function adicionarLance(dados: {
  url: string;
  titulo: string;
  jogoId: number | null;
  golId: number | null;
}): Promise<RetornoLance> {
  await requireAdmin();
  const video = analisarVideo(String(dados.url ?? ""));
  if (!video) return { ok: false, erro: "Cole um link https (YouTube, Lance Replay ou arquivo de vídeo)." };

  const titulo = String(dados.titulo ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || null;
  let jogoId = Number.isInteger(dados.jogoId) ? dados.jogoId : null;
  let golId = Number.isInteger(dados.golId) ? dados.golId : null;

  if (golId !== null) {
    const gol = await db.gol.findUnique({ where: { id: golId }, select: { jogoId: true } });
    if (!gol) golId = null;
    else jogoId = gol.jogoId; // o gol manda: o lance fica no jogo do gol
  }
  if (jogoId !== null && !(await db.jogo.count({ where: { id: jogoId } }))) jogoId = null;

  await db.lance.create({ data: { url: String(dados.url).trim(), titulo, jogoId, golId } });
  revalidar();
  return { ok: true };
}

export async function removerLance(id: number): Promise<void> {
  await requireAdmin();
  await db.lance.deleteMany({ where: { id } });
  revalidar();
}
