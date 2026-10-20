import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NavPainel } from "@/components/nav-painel";
import { requireAdmin } from "@/lib/auth";
import { EVENTO } from "@/lib/evento";
import { logout } from "../actions";

export const metadata: Metadata = { title: `Painel · ${EVENTO.titulo}`, robots: { index: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-campo-700 bg-campo-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 pt-3">
            <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
              <Image src="/escudo.jpg" alt="" width={36} height={36} className="size-9 rounded-lg" />
              <span className="font-display truncate text-2xl leading-none tracking-wide">
                <span className="text-fla-500">Torneio</span> do {EVENTO.aniversariante}
              </span>
              <span className="hidden rounded-md bg-campo-800 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 sm:inline">
                Painel
              </span>
            </Link>
            <div className="ml-auto flex shrink-0 items-center gap-1 text-sm">
              <Link href="/torneio" target="_blank" className="hidden rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-campo-800 hover:text-white sm:inline">
                Site ↗
              </Link>
              <Link href="/torneio/tv" target="_blank" className="hidden rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-campo-800 hover:text-white sm:inline">
                TV ↗
              </Link>
              <form action={logout}>
                <button className="rounded-lg px-2.5 py-1.5 text-zinc-500 hover:bg-campo-800 hover:text-white">Sair</button>
              </form>
            </div>
          </div>
          <div className="-mx-1 mt-1">
            <NavPainel />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
