"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const GRUPOS = [
  {
    nome: "Festa",
    links: [
      { href: "/admin", rotulo: "Resumo" },
      { href: "/admin/convidados", rotulo: "Convidados" },
      { href: "/admin/lembretes", rotulo: "Lembretes" },
      { href: "/admin/jogadores", rotulo: "Jogadores" },
    ],
  },
  {
    nome: "Torneio",
    links: [
      { href: "/admin/times", rotulo: "Times" },
      { href: "/admin/tabela", rotulo: "Tabela" },
      { href: "/admin/jogos", rotulo: "Jogos" },
      { href: "/admin/lances", rotulo: "Lances" },
    ],
  },
];

function ativo(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Abas do painel; a aba atual fica sublinhada e, no celular, rola para ficar à vista. */
export function NavPainel() {
  const pathname = usePathname();
  const atual = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    atual.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav
      aria-label="Seções do painel"
      className="flex gap-1 overflow-x-auto text-sm font-medium [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {GRUPOS.map((g, gi) => (
        <div key={g.nome} className="flex shrink-0 items-center gap-1">
          {gi > 0 && <span aria-hidden="true" className="mx-2 h-5 w-px bg-campo-600" />}
          <span className="mr-1 hidden text-[11px] uppercase tracking-widest text-zinc-600 md:inline">{g.nome}</span>
          {g.links.map((l) => {
            const eh = ativo(pathname, l.href);
            return (
              <Link
                key={l.href}
                ref={eh ? atual : undefined}
                href={l.href}
                aria-current={eh ? "page" : undefined}
                className={`relative shrink-0 rounded-lg px-3 py-2.5 transition-colors ${
                  eh ? "text-white" : "text-zinc-400 hover:bg-campo-800 hover:text-white"
                }`}
              >
                {l.rotulo}
                {eh && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-fla-500" />}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
