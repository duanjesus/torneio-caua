import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { EVENTO } from "@/lib/evento";
import { logout } from "../actions";

export const metadata: Metadata = { title: `Painel · ${EVENTO.titulo}`, robots: { index: false } };

const LINKS = [
  { href: "/admin", rotulo: "Resumo" },
  { href: "/admin/convidados", rotulo: "Convidados" },
  { href: "/admin/jogadores", rotulo: "Jogadores" },
  { href: "/admin/times", rotulo: "Times" },
  { href: "/admin/tabela", rotulo: "Tabela" },
  { href: "/admin/jogos", rotulo: "Jogos" },
  { href: "/torneio", rotulo: "Site ao vivo ↗" },
  { href: "/torneio/tv", rotulo: "Modo TV ↗" },
];

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-campo-700 bg-campo-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:py-3">
          <Link href="/admin" className="font-display shrink-0 text-2xl tracking-wide">
            <span className="text-fla-500">Torneio</span> do {EVENTO.aniversariante}
          </Link>
          <nav className="-mx-3 order-last flex w-full gap-1 overflow-x-auto text-sm font-medium [scrollbar-width:none] sm:order-none sm:mx-0 sm:w-auto sm:flex-1 [&::-webkit-scrollbar]:hidden">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="shrink-0 rounded-lg px-3 py-2 text-zinc-300 hover:bg-campo-800 hover:text-white">
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <form action={logout} className="ml-auto sm:ml-0">
            <button className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-campo-800 hover:text-white">Sair</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
