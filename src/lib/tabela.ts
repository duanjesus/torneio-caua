// Montagem da tabela: grupos, mata-mata e horários. Puro, para dar para testar.
//
// Cada lado de um jogo tem uma "fonte" que diz de onde vem o time:
//   T:12    o time 12, já conhecido
//   G:A:1   o 1º colocado do grupo A (sai quando o grupo termina)
//   V:7     o vencedor do jogo 7
//   D:7     o perdedor do jogo 7 (disputa de 3º lugar)

export type Formato = "GRUPOS" | "MATA";
export type Fase = "GRUPOS" | "OITAVAS" | "QUARTAS" | "SEMI" | "TERCEIRO" | "FINAL";

export type ConfigTabela = {
  formato: Formato;
  /** Só em GRUPOS: 1, 2 ou 4 grupos. Um grupo só é "pontos corridos". */
  numGrupos: number;
  /** Só em GRUPOS: quantos de cada grupo vão para o mata-mata (0 = sem mata-mata). */
  classificados: number;
  terceiroLugar: boolean;
  campos: number;
  /** Minutos de cada jogo. */
  duracao: number;
  /** Minutos entre um jogo e o próximo no mesmo campo. */
  intervalo: number;
  /** "HH:MM" do primeiro jogo. */
  inicio: string;
};

export type JogoPlanejado = {
  numero: number;
  fase: Fase;
  grupo: string | null;
  rodada: number;
  fonteA: string;
  fonteB: string;
  campo: number;
  horario: string;
};

export const NOMES_GRUPOS = ["A", "B", "C", "D"] as const;

export const ROTULO_FASE: Record<Fase, string> = {
  GRUPOS: "Fase de grupos",
  OITAVAS: "Oitavas de final",
  QUARTAS: "Quartas de final",
  SEMI: "Semifinal",
  TERCEIRO: "Disputa de 3º lugar",
  FINAL: "Final",
};

const potenciaDe2 = (n: number) => n >= 2 && (n & (n - 1)) === 0;
const proximaPotenciaDe2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)));

export function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function hhmm(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(totalMinutos % 60).padStart(2, "0")}`;
}

/** Devolve o motivo de a configuração não servir para `numTimes` times, ou null. */
export function validarConfig(cfg: ConfigTabela, numTimes: number): string | null {
  if (numTimes < 2) return "São precisos pelo menos 2 times.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cfg.inicio)) return "Horário de início inválido.";
  if (!Number.isInteger(cfg.campos) || cfg.campos < 1 || cfg.campos > 4) return "De 1 a 4 campos.";
  if (!Number.isInteger(cfg.duracao) || cfg.duracao < 4 || cfg.duracao > 60) return "Jogo de 4 a 60 minutos.";
  if (!Number.isInteger(cfg.intervalo) || cfg.intervalo < 0 || cfg.intervalo > 30) return "Intervalo de 0 a 30 minutos.";

  if (cfg.formato === "MATA") {
    if (numTimes > 16) return "Mata-mata com no máximo 16 times.";
    return null;
  }
  if (![1, 2, 4].includes(cfg.numGrupos)) return "Escolha 1, 2 ou 4 grupos.";
  const menorGrupo = Math.floor(numTimes / cfg.numGrupos);
  if (menorGrupo < 2) return `Com ${numTimes} times não dá para ter ${cfg.numGrupos} grupos.`;
  if (![0, 1, 2, 4].includes(cfg.classificados)) return "Classificam 0, 1, 2 ou 4 por grupo.";
  if (cfg.classificados > menorGrupo) return `Os grupos têm só ${menorGrupo} times; não classificam ${cfg.classificados}.`;
  if (cfg.classificados === 0 && cfg.numGrupos > 1) return "Com mais de um grupo, alguém precisa se classificar.";
  const noMata = cfg.numGrupos * cfg.classificados;
  if (noMata !== 0 && !potenciaDe2(noMata)) return "O total de classificados precisa ser 2, 4, 8 ou 16.";
  return null;
}

/** Times divididos em grupos na ordem recebida (quem chama embaralha). */
export function distribuirGrupos(timeIds: readonly number[], numGrupos: number): Record<string, number[]> {
  const grupos: Record<string, number[]> = {};
  for (let g = 0; g < numGrupos; g++) grupos[NOMES_GRUPOS[g]] = [];
  timeIds.forEach((id, i) => grupos[NOMES_GRUPOS[i % numGrupos]].push(id));
  return grupos;
}

/** Todos contra todos (método do círculo): lista de rodadas, cada uma com seus confrontos. */
export function rodizio<T>(itens: readonly T[]): [T, T][][] {
  const lista: (T | null)[] = itens.length % 2 === 0 ? [...itens] : [...itens, null];
  const n = lista.length;
  const rodadas: [T, T][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const rodada: [T, T][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i];
      const b = lista[n - 1 - i];
      if (a !== null && b !== null) rodada.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rodadas.push(rodada);
    // gira todos menos o primeiro
    lista.splice(1, 0, lista.pop()!);
  }
  return rodadas;
}

/** Ordem das posições na chave para que os cabeças de chave 1 e 2 só se cruzem na final. */
export function ordemChave(n: number): number[] {
  let ordem = [1];
  while (ordem.length < n) {
    const total = ordem.length * 2 + 1;
    ordem = ordem.flatMap((s) => [s, total - s]);
  }
  return ordem;
}

const FASE_POR_TAMANHO: Record<number, Fase> = { 2: "FINAL", 4: "SEMI", 8: "QUARTAS", 16: "OITAVAS" };

type Rascunho = Omit<JogoPlanejado, "campo" | "horario"> & { bloco: number };

/**
 * Monta todos os jogos com campo e horário.
 * GRUPOS: `grupos` diz quem está em cada grupo. MATA: `timesMata` é a ordem dos cabeças de chave
 * (quem chama sorteia); quando o número de times não é potência de 2, os primeiros folgam na 1ª rodada.
 */
export function montarTabela(
  cfg: ConfigTabela,
  entrada: { grupos?: Record<string, number[]>; timesMata?: number[] },
): { jogos: JogoPlanejado[]; termino: string } {
  const rascunhos: Rascunho[] = [];
  let seq = 0;
  const novo = (j: Omit<Rascunho, "numero">) => {
    const r = { ...j, numero: ++seq };
    rascunhos.push(r);
    return r;
  };

  let cabecas: (string | null)[] = [];

  if (cfg.formato === "GRUPOS") {
    const grupos = entrada.grupos ?? {};
    const nomes = Object.keys(grupos).sort();
    const rodadasPorGrupo = nomes.map((g) => rodizio(grupos[g]));
    const maxRodadas = Math.max(0, ...rodadasPorGrupo.map((r) => r.length));
    // Intercala os grupos rodada a rodada: os times descansam entre um jogo e outro.
    for (let r = 0; r < maxRodadas; r++) {
      nomes.forEach((g, gi) => {
        for (const [a, b] of rodadasPorGrupo[gi][r] ?? []) {
          novo({ fase: "GRUPOS", grupo: g, rodada: r + 1, fonteA: `T:${a}`, fonteB: `T:${b}`, bloco: 0 });
        }
      });
    }
    for (let p = 1; p <= cfg.classificados; p++) for (const g of nomes) cabecas.push(`G:${g}:${p}`);
  } else {
    const times = entrada.timesMata ?? [];
    const tamanho = proximaPotenciaDe2(times.length);
    cabecas = [...times.map((id) => `T:${id}`), ...Array<null>(tamanho - times.length).fill(null)];
  }

  if (cabecas.length >= 2) {
    let lados: (string | null)[] = ordemChave(cabecas.length).map((s) => cabecas[s - 1]);
    let bloco = 1;
    let semis: Rascunho[] = [];
    while (lados.length >= 2) {
      const fase = FASE_POR_TAMANHO[lados.length];
      const proximos: (string | null)[] = [];
      const daRodada: Rascunho[] = [];
      for (let i = 0; i < lados.length; i += 2) {
        const [a, b] = [lados[i], lados[i + 1]];
        if (a === null || b === null) {
          proximos.push(a ?? b); // folga: passa direto
          continue;
        }
        if (fase === "FINAL" && cfg.terceiroLugar && semis.length === 2) {
          novo({ fase: "TERCEIRO", grupo: null, rodada: 1, fonteA: `D:${semis[0].numero}`, fonteB: `D:${semis[1].numero}`, bloco });
          bloco++;
        }
        const j = novo({ fase, grupo: null, rodada: 1, fonteA: a, fonteB: b, bloco });
        daRodada.push(j);
        proximos.push(`V:${j.numero}`);
      }
      if (fase === "SEMI") semis = daRodada;
      lados = proximos;
      bloco++;
    }
  }

  return agendar(rascunhos, cfg);
}

/** Encaixa os jogos em horários e campos, sem time jogando duas vezes ao mesmo tempo. */
function agendar(rascunhos: Rascunho[], cfg: ConfigTabela): { jogos: JogoPlanejado[]; termino: string } {
  const blocos = [...new Set(rascunhos.map((r) => r.bloco))].sort((a, b) => a - b);
  const slots: Rascunho[][] = [];

  for (const bloco of blocos) {
    const fila = rascunhos.filter((r) => r.bloco === bloco);
    while (fila.length > 0) {
      const anterior = new Set((slots.at(-1) ?? []).flatMap((j) => [j.fonteA, j.fonteB]));
      const noSlot: Rascunho[] = [];
      const ocupados = new Set<string>();
      const cabe = (j: Rascunho) => !ocupados.has(j.fonteA) && !ocupados.has(j.fonteB);
      // 1ª passada: prefere quem não jogou no horário anterior; 2ª: completa os campos.
      for (const descansado of [true, false]) {
        for (const j of [...fila]) {
          if (noSlot.length >= cfg.campos) break;
          if (!cabe(j)) continue;
          if (descansado && (anterior.has(j.fonteA) || anterior.has(j.fonteB))) continue;
          noSlot.push(j);
          ocupados.add(j.fonteA).add(j.fonteB);
          fila.splice(fila.indexOf(j), 1);
        }
      }
      slots.push(noSlot);
    }
  }

  // Renumera na ordem em que os jogos acontecem e corrige as referências V:/D:.
  const novoNumero = new Map<number, number>();
  slots.flat().forEach((j, i) => novoNumero.set(j.numero, i + 1));
  const ref = (f: string) => f.replace(/^([VD]):(\d+)$/, (_, t, n) => `${t}:${novoNumero.get(Number(n))}`);

  const passo = cfg.duracao + cfg.intervalo;
  const inicio = minutos(cfg.inicio);
  const jogos = slots.flatMap((slot, k) =>
    slot.map(({ bloco: _b, ...j }, c) => ({
      ...j,
      numero: novoNumero.get(j.numero)!,
      fonteA: ref(j.fonteA),
      fonteB: ref(j.fonteB),
      campo: c + 1,
      horario: hhmm(inicio + k * passo),
    })),
  );
  const termino = hhmm(inicio + Math.max(0, slots.length - 1) * passo + cfg.duracao);
  return { jogos, termino };
}

/** Texto para um lado de jogo cujo time ainda não está definido. */
export function rotuloFonte(fonte: string | null): string {
  if (!fonte) return "A definir";
  const g = /^G:(\w+):(\d+)$/.exec(fonte);
  if (g) return `${g[2]}º do Grupo ${g[1]}`;
  const v = /^([VD]):(\d+)$/.exec(fonte);
  if (v) return `${v[1] === "V" ? "Vencedor" : "Perdedor"} do Jogo ${v[2]}`;
  return "A definir";
}
