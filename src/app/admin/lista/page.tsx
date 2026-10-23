import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireLeitura } from "@/lib/auth";
import { db } from "@/lib/db";
import { EVENTO } from "@/lib/evento";
import { nomesDosAdultos } from "@/lib/resposta";
import { logout } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Confirmados · ${EVENTO.titulo}`, robots: { index: false } };

const plural = (n: number, palavra: string) => `${n} ${palavra}${n === 1 ? "" : "s"}`;

/**
 * Lista de confirmados, só para ler. É a única tela de quem entra com a senha de leitura:
 * mostra adultos, crianças e recados, e baixa a planilha; sem link de edição e sem nenhuma ação.
 */
export default async function ListaDeConfirmados({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const papel = await requireLeitura();
  const busca = ((await searchParams).q ?? "").trim();

  const familias = await db.resposta.findMany({
    where: {
      presenca: "SIM",
      ...(busca && {
        OR: [
          { responsavel: { contains: busca, mode: "insensitive" } },
          { criancas: { some: { nome: { contains: busca, mode: "insensitive" } } } },
        ],
      }),
    },
    select: {
      id: true,
      responsavel: true,
      presenca: true,
      adultos: true,
      acompanhantes: true,
      recado: true,
      criancas: { orderBy: { ordem: "asc" }, select: { id: true, nome: true, idade: true, joga: true } },
    },
    orderBy: { responsavel: "asc" },
  });

  const adultos = familias.reduce((s, f) => s + f.adultos, 0);
  const criancas = familias.reduce((s, f) => s + f.criancas.length, 0);
  const jogam = familias.reduce((s, f) => s + f.criancas.filter((c) => c.joga).length, 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-campo-700 bg-campo-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Image src="/escudo.png" alt="" width={40} height={40} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-2xl leading-none tracking-wide">
              <span className="text-fla-500">Torneio</span> do {EVENTO.aniversariante}
            </p>
            <p className="text-xs text-zinc-500">Lista de confirmados{papel === "leitor" && " · só leitura"}</p>
          </div>
          {papel === "admin" && (
            <Link href="/admin" className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 hover:bg-campo-800 hover:text-white">
              Painel
            </Link>
          )}
          <form action={logout}>
            <button className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 hover:bg-campo-800 hover:text-white">Sair</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <h1 className="font-display text-4xl tracking-wide">Confirmados</h1>

        {!busca && (
          <section className="grid grid-cols-3 gap-3">
            <Numero valor={adultos + criancas} rotulo="pessoas" destaque />
            <Numero valor={familias.length} rotulo={familias.length === 1 ? "família" : "famílias"} />
            <Numero valor={jogam} rotulo={jogam === 1 ? "joga" : "jogam"} />
          </section>
        )}

        <div className="flex gap-2">
          <form action="/admin/lista" className="min-w-0 flex-1">
            <input
              name="q"
              type="search"
              defaultValue={busca}
              aria-label="Buscar família ou criança"
              placeholder="Buscar família ou criança"
              className="campo py-2 text-sm"
            />
          </form>
          <a href="/admin/exportar" className="btn-pequeno shrink-0">
            Baixar planilha
          </a>
        </div>

        {familias.length === 0 ? (
          <p className="cartao p-6 text-center text-zinc-400">{busca ? "Ninguém com esse nome." : "Ninguém confirmou ainda."}</p>
        ) : (
          <ul className="space-y-3">
            {familias.map((f) => (
              <li key={f.id} className="cartao p-4">
                <p className="font-semibold">{f.responsavel}</p>
                <p className="text-sm text-zinc-400">
                  {plural(f.adultos, "adulto")}
                  {f.criancas.length > 0 && ` · ${f.criancas.length === 1 ? "1 criança" : `${f.criancas.length} crianças`}`}
                </p>
                {f.adultos > 0 && (
                  <p className="mt-1 text-sm text-zinc-300">
                    <span className="text-zinc-500">Adultos:</span> {nomesDosAdultos(f).join(", ")}
                  </p>
                )}
                {f.criancas.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {f.criancas.map((c) => (
                      <li
                        key={c.id}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          c.joga ? "border-fla-500/50 bg-fla-500/10" : "border-campo-600 text-zinc-400"
                        }`}
                      >
                        {c.joga ? "⚽ " : ""}
                        {c.nome} <span className="text-zinc-500">{c.idade}a</span>
                      </li>
                    ))}
                  </ul>
                )}
                {f.recado && <p className="mt-3 text-sm italic text-zinc-300">“{f.recado}”</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="text-center text-xs text-zinc-500">⚽ = vai jogar no torneio</p>
      </main>
    </div>
  );
}

function Numero({ valor, rotulo, destaque }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className={`cartao p-4 text-center ${destaque ? "border-fla-500/50" : ""}`}>
      <p className={`font-display text-4xl leading-none ${destaque ? "text-fla-500" : ""}`}>{valor}</p>
      <p className="mt-1 text-xs text-zinc-400">{rotulo}</p>
    </div>
  );
}
