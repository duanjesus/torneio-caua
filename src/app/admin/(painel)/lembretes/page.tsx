import Link from "next/link";
import { BotaoLembrete } from "@/components/botao-lembrete";
import { db } from "@/lib/db";
import { EVENTO, publicUrl } from "@/lib/evento";
import { mensagemTalvez, mensagemVespera } from "@/lib/lembretes";
import { formatarTelefone, whatsappUrl } from "@/lib/resposta";

export const dynamic = "force-dynamic";

export default async function Lembretes({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const tipo = (await searchParams).tipo === "vespera" ? "vespera" : "talvez";
  const url = publicUrl();

  const familias = await db.resposta.findMany({
    where: { presenca: tipo === "talvez" ? "TALVEZ" : "SIM" },
    include: { criancas: { where: { joga: true }, orderBy: { ordem: "asc" }, select: { nome: true } } },
    orderBy: { responsavel: "asc" },
  });
  const [qtdTalvez, qtdSim] = await Promise.all([
    db.resposta.count({ where: { presenca: "TALVEZ" } }),
    db.resposta.count({ where: { presenca: "SIM" } }),
  ]);

  const linhas = familias.map((f) => {
    const jogadores = f.criancas.map((c) => c.nome);
    const mensagem =
      tipo === "talvez" ? mensagemTalvez(f, url) : mensagemVespera({ responsavel: f.responsavel, jogadores }, url);
    const enviadoEm = tipo === "talvez" ? f.lembreteTalvezEm : f.lembreteVesperaEm;
    return { f, jogadores, mensagem, enviadoEm };
  });
  const enviados = linhas.filter((l) => l.enviadoEm).length;
  const comTelefone = linhas.filter((l) => l.f.telefone);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Lembretes</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Uma mensagem pronta por família. Toque em “Enviar no WhatsApp”, confira e mande; a lista marca quem já recebeu.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-campo-700 bg-campo-900 p-1">
        {(
          [
            ["talvez", `Quem marcou talvez (${qtdTalvez})`],
            ["vespera", `Véspera: confirmados (${qtdSim})`],
          ] as const
        ).map(([valor, rotulo]) => (
          <Link
            key={valor}
            href={`/admin/lembretes${valor === "talvez" ? "" : "?tipo=vespera"}`}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium ${
              tipo === valor ? "bg-fla-500 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            {rotulo}
          </Link>
        ))}
      </div>

      <p className="text-sm text-zinc-400">
        {tipo === "talvez"
          ? `Para mandar agora, antes do prazo (${EVENTO.prazoTexto}). O link leva cada família direto para a própria resposta.`
          : `Para mandar no sábado, véspera da festa. Quem tem criança jogando recebe o aviso da chuteira.`}
      </p>

      {linhas.length === 0 ? (
        <p className="cartao p-6 text-center text-zinc-400">
          {tipo === "talvez" ? "Ninguém marcou “talvez”. 🎉" : "Ninguém confirmou ainda."}
        </p>
      ) : (
        <>
          <p className="text-sm">
            <strong className="text-white">{enviados}</strong> <span className="text-zinc-400">de {linhas.length} lembrados</span>
            {comTelefone.length < linhas.length && (
              <span className="text-zinc-500"> · {linhas.length - comTelefone.length} sem WhatsApp cadastrado</span>
            )}
          </p>

          <ul className="space-y-3">
            {linhas.map(({ f, jogadores, mensagem, enviadoEm }) => (
              <li key={f.id} className={`cartao p-4 ${enviadoEm ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/convidados/${f.id}`} className="font-semibold hover:text-fla-400">
                      {f.responsavel}
                    </Link>
                    <p className="text-sm text-zinc-400">
                      {f.telefone ? formatarTelefone(f.telefone) : "sem WhatsApp"}
                      {jogadores.length > 0 && ` · joga: ${jogadores.map((n) => n.split(" ")[0]).join(", ")}`}
                    </p>
                  </div>
                  {f.telefone ? (
                    <BotaoLembrete
                      respostaId={f.id}
                      tipo={tipo}
                      href={whatsappUrl(f.telefone, mensagem)}
                      enviadoEm={enviadoEm?.toISOString() ?? null}
                    />
                  ) : (
                    <Link href={`/admin/convidados/${f.id}`} className="btn-pequeno shrink-0">
                      Pôr telefone
                    </Link>
                  )}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">Ver a mensagem</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-campo-700 bg-campo-950 p-3 font-sans text-sm text-zinc-300">
                    {mensagem}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
