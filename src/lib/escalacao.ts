// Como desenhar um time em campo, igual às escalações de TV. Puro, para dar para testar.

/**
 * Quantos jogadores de linha em cada fileira, da defesa para o ataque.
 * Até 3 numa fileira só; até 6 em duas; acima disso em três. As de trás ficam com a sobra.
 */
export function formacao(n: number): number[] {
  if (n <= 0) return [];
  const fileiras = n <= 3 ? 1 : n <= 6 ? 2 : 3;
  const base = Math.floor(n / fileiras);
  const sobra = n % fileiras;
  return Array.from({ length: fileiras }, (_, i) => base + (i < sobra ? 1 : 0));
}

/**
 * Separa o goleiro (o primeiro marcado como goleiro) e distribui o resto nas fileiras.
 * Sem goleiro marcado, o gol fica vazio: criança não vai para o gol sem ter topado.
 */
export function montarEscalacao<T extends { goleiro: boolean }>(jogadores: readonly T[]): { goleiro: T | null; fileiras: T[][] } {
  const goleiro = jogadores.find((j) => j.goleiro) ?? null;
  const linha = jogadores.filter((j) => j !== goleiro);
  const fileiras: T[][] = [];
  let i = 0;
  for (const tamanho of formacao(linha.length)) {
    fileiras.push(linha.slice(i, i + tamanho));
    i += tamanho;
  }
  return { goleiro, fileiras };
}

/** Iniciais para quando a criança não tem foto: "Ana Paula Souza" → "AS". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}
