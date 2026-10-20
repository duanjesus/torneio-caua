// Sorteio de times equilibrados. Puro, para dar para testar.

export type JogadorSorteio = { id: number; idade: number; nivel: number | null; goleiro: boolean };
export type Rng = () => number;

export const CORES = [
  { nome: "Vermelho", hex: "#e10600" },
  { nome: "Preto", hex: "#18181b" },
  { nome: "Branco", hex: "#f4f4f5" },
  { nome: "Azul", hex: "#2563eb" },
  { nome: "Amarelo", hex: "#facc15" },
  { nome: "Verde", hex: "#16a34a" },
  { nome: "Laranja", hex: "#f97316" },
  { nome: "Roxo", hex: "#7c3aed" },
  { nome: "Rosa", hex: "#ec4899" },
  { nome: "Cinza", hex: "#71717a" },
] as const;

export const MAX_TIMES = CORES.length;

/** Gerador com semente (mulberry32): o mesmo sorteio sai igual nos testes. */
export function rngComSemente(semente: number): Rng {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralhar<T>(itens: readonly T[], rng: Rng = Math.random): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Peso do jogador: o nível dado pelo admin manda; a idade desempata. Sem nível conta como 2. */
export function forca(j: Pick<JogadorSorteio, "idade" | "nivel">): number {
  return (j.nivel ?? 2) * 2 + j.idade / 4;
}

/**
 * Distribui os jogadores em `numTimes` times do mesmo tamanho (diferença máxima de 1),
 * espalhando os goleiros primeiro e depois os mais fortes, sempre para o time mais fraco
 * entre os que têm menos gente. Devolve os ids de cada time.
 */
export function sortearTimes(jogadores: readonly JogadorSorteio[], numTimes: number, rng: Rng = Math.random): number[][] {
  if (!Number.isInteger(numTimes) || numTimes < 2) throw new Error("São precisos pelo menos 2 times.");

  // Embaralha antes de ordenar: quem tem a mesma força cai em ordem diferente a cada sorteio.
  const porForca = embaralhar(jogadores, rng).sort((a, b) => forca(b) - forca(a));
  const goleiros = porForca.filter((j) => j.goleiro);
  const linha = porForca.filter((j) => !j.goleiro);

  const times = Array.from({ length: numTimes }, () => ({ ids: [] as number[], forca: 0, goleiros: 0 }));
  const ordemTimes = embaralhar(times.map((_, i) => i), rng);

  const escolher = (criterio: (t: (typeof times)[number]) => number[]) =>
    ordemTimes.reduce((melhor, i) => {
      const a = criterio(times[i]);
      const b = criterio(times[melhor]);
      for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] < b[k] ? i : melhor;
      return melhor;
    }, ordemTimes[0]);

  for (const g of goleiros) {
    const i = escolher((t) => [t.goleiros, t.ids.length, t.forca]);
    times[i].ids.push(g.id);
    times[i].forca += forca(g);
    times[i].goleiros++;
  }
  for (const j of linha) {
    const i = escolher((t) => [t.ids.length, t.forca]);
    times[i].ids.push(j.id);
    times[i].forca += forca(j);
  }
  return times.map((t) => t.ids);
}
