import Link from "next/link";
import { SeloPresenca } from "@/components/selo-presenca";
import { db } from "@/lib/db";
import { formatarTelefone, nomesDosAdultos, whatsappUrl } from "@/lib/resposta";

export const dynamic = "force-dynamic";

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "SIM", rotulo: "Vão" },
  { valor: "TALVEZ", rotulo: "Talvez" },
  { valor: "NAO", rotulo: "Não vão" },
] as const;

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default async function Convidados({ searchParams }: { searchParams: Promise<{ p?: string; q?: string }> }) {
  const { p = "", q = "" } = await searchParams;
  const presenca = p === "SIM" || p === "TALVEZ" || p === "NAO" ? p : undefined;
  const busca = q.trim();

  const respostas = await db.resposta.findMany({
    where: {
      presenca,
      ...(busca && {
        OR: [
          { responsavel: { contains: busca, mode: "insensitive" } },
          { criancas: { some: { nome: { contains: busca, mode: "insensitive" } } } },
        ],
      }),
    },
    include: { criancas: { orderBy: { ordem: "asc" } } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide">Convidados</h1>
        <div className="flex gap-2">
          <a href="/admin/exportar" className="btn-pequeno">
            Baixar planilha
          </a>
          <Link href="/admin/convidados/novo" className="btn-pequeno border-fla-500 bg-fla-500 hover:bg-fla-400">
            + Adicionar
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/convidados">
        <div className="flex gap-1 rounded-xl border border-campo-700 bg-campo-900 p-1">
          {FILTROS.map((f) => {
            const params = new URLSearchParams({ ...(f.valor && { p: f.valor }), ...(busca && { q: busca }) });
            const ativo = (presenca ?? "") === f.valor;
            return (
              <Link
                key={f.valor}
                href={`/admin/convidados${params.size ? `?${params}` : ""}`}
                className={`rounded-lg px-3 py-1.5 text-sm ${ativo ? "bg-fla-500 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                {f.rotulo}
              </Link>
            );
          })}
        </div>
        {presenca && <input type="hidden" name="p" value={presenca} />}
        <input
          name="q"
          type="search"
          aria-label="Buscar convidado ou criança"
          defaultValue={busca}
          placeholder="Buscar nome do adulto ou criança"
          className="campo min-w-0 basis-full py-2 text-sm sm:basis-0 sm:flex-1"
        />
      </form>

      {respostas.length === 0 ? (
        <p className="cartao p-6 text-center text-zinc-400">Nenhuma resposta {busca || presenca ? "com esse filtro" : "ainda"}.</p>
      ) : (
        <ul className="space-y-3">
          {respostas.map((r) => (
            <li key={r.id} className="cartao p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/convidados/${r.id}`} className="text-lg font-semibold hover:text-fla-400">
                      {r.responsavel}
                    </Link>
                    <SeloPresenca presenca={r.presenca} />
                    {r.criadoPeloAdmin && <span className="text-xs text-zinc-500">cadastrado por você</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {r.telefone ? (
                      <a href={whatsappUrl(r.telefone)} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">
                        {formatarTelefone(r.telefone)}
                      </a>
                    ) : (
                      "sem telefone"
                    )}
                    {" · "}
                    {r.presenca !== "NAO" && `${r.adultos} ${r.adultos === 1 ? "adulto" : "adultos"} · `}
                    respondeu {dataHora.format(r.criadoEm)}
                  </p>
                  {r.adultos > 0 && (
                    <p className="mt-1 text-sm text-zinc-300">
                      <span className="text-zinc-500">Adultos:</span> {nomesDosAdultos(r).join(", ")}
                    </p>
                  )}
                </div>
                <Link href={`/admin/convidados/${r.id}`} className="btn-pequeno">
                  Editar
                </Link>
              </div>

              {r.criancas.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {r.criancas.map((c) => (
                    <li
                      key={c.id}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        c.joga ? "border-fla-500/50 bg-fla-500/10" : "border-campo-600 text-zinc-400"
                      }`}
                    >
                      {c.joga && "⚽ "}
                      {c.nome} <span className="text-zinc-500">{c.idade}a</span>
                      {c.goleiro && " 🧤"}
                    </li>
                  ))}
                </ul>
              )}
              {r.recado && <p className="mt-3 text-sm italic text-zinc-300">“{r.recado}”</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
