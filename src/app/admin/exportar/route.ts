import { papelAtual } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatarTelefone, nomesDosAdultos } from "@/lib/resposta";

const PRESENCA = { SIM: "Vai", TALVEZ: "Talvez", NAO: "Não vai" } as const;

/** Planilha (CSV para Excel/Google Planilhas) com uma linha por pessoa listada. */
export async function GET() {
  // Organizador e quem tem a senha de leitura (liberado a pedido do organizador)
  if (!(await papelAtual())) return new Response("Não autorizado", { status: 401 });

  const respostas = await db.resposta.findMany({
    include: { criancas: { orderBy: { ordem: "asc" } } },
    orderBy: { responsavel: "asc" },
  });

  const linhas: string[][] = [
    ["Responsável", "WhatsApp", "Presença", "Adultos", "Nomes dos adultos", "Criança", "Idade", "Joga", "Goleiro", "Nível", "Recado"],
  ];
  for (const r of respostas) {
    const base = [r.responsavel, formatarTelefone(r.telefone), PRESENCA[r.presenca], String(r.adultos), nomesDosAdultos(r).join(", ")];
    if (r.criancas.length === 0) linhas.push([...base, "", "", "", "", "", r.recado ?? ""]);
    for (const c of r.criancas) {
      linhas.push([
        ...base,
        c.nome,
        String(c.idade),
        c.joga ? "sim" : "não",
        c.goleiro ? "sim" : "não",
        c.nivel ? String(c.nivel) : "",
        r.recado ?? "",
      ]);
    }
  }

  // Ponto e vírgula + BOM: é o que o Excel em português abre certo com dois cliques.
  const celula = (v: string) => (/[";\n\r]/.test(v) || /^[=+\-@]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const seguro = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);
  const csv = "﻿" + linhas.map((l) => l.map((v) => celula(seguro(v))).join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="convidados-torneio-caua.csv"',
      "Cache-Control": "no-store",
    },
  });
}
