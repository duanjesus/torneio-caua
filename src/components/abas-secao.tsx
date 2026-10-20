"use client";

import { useEffect, useState } from "react";

/**
 * Barra de abas fixa no topo que leva a cada seção da página e acende a seção que
 * está na tela. As seções são <section id="..."> comuns: sem JavaScript, os links ainda funcionam.
 */
export function AbasSecao({ secoes }: { secoes: { id: string; titulo: string }[] }) {
  const [atual, setAtual] = useState(secoes[0]?.id);

  useEffect(() => {
    const visiveis = new Map<string, boolean>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visiveis.set(e.target.id, e.isIntersecting);
        const primeira = secoes.find((s) => visiveis.get(s.id));
        if (primeira) setAtual(primeira.id);
      },
      { rootMargin: "-64px 0px -55% 0px" },
    );
    for (const s of secoes) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [secoes]);

  useEffect(() => {
    document.getElementById(`aba-${atual}`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [atual]);

  return (
    <nav
      aria-label="Seções"
      className="sticky top-0 z-20 border-b border-campo-700 bg-campo-950/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {secoes.map((s) => {
          const eh = s.id === atual;
          return (
            <a
              key={s.id}
              id={`aba-${s.id}`}
              href={`#${s.id}`}
              aria-current={eh ? "true" : undefined}
              className={`relative shrink-0 px-3 py-3 text-sm font-semibold transition-colors ${eh ? "text-white" : "text-zinc-500 hover:text-zinc-200"}`}
            >
              {s.titulo}
              {eh && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-fla-500" />}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
