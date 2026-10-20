// Validação da resposta ao convite. Puro (sem banco) para dar para testar.

export type Presenca = "SIM" | "NAO" | "TALVEZ";
export const PRESENCAS: readonly Presenca[] = ["SIM", "NAO", "TALVEZ"];

export type CriancaInput = {
  /** Presente quando a criança já existe (edição); preserva nível e times. */
  id?: number;
  nome: string;
  idade: number;
  joga: boolean;
  goleiro: boolean;
  /** Nome do arquivo devolvido pelo upload (ver src/lib/fotos.ts); null = sem foto. */
  foto: string | null;
};

/** Só aceita o formato de nome que o servidor gera: impede apontar para outro arquivo ou site. */
export function nomeFotoValido(nome: unknown): nome is string {
  return typeof nome === "string" && /^[A-Za-z0-9_-]{16,40}\.(jpg|png|webp)$/.test(nome);
}

export type RespostaInput = {
  responsavel: string;
  telefone: string;
  presenca: Presenca;
  adultos: number;
  recado: string;
  criancas: CriancaInput[];
};

export type Erros = Record<string, string>;
export type Resultado = { ok: true; valor: RespostaInput } | { ok: false; erros: Erros };

export const LIMITES = {
  adultos: 20,
  criancas: 12,
  idadeMax: 17,
  recado: 300,
} as const;

const texto = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

function inteiro(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isInteger(n) ? n : null;
}

/** Só dígitos, sem o 55 do Brasil. Aceita "(21) 99999-9999", "+55 21 99999 9999" etc. */
export function normalizarTelefone(v: string): string {
  let d = v.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d;
}

export function formatarTelefone(d: string): string {
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

export function whatsappUrl(telefone: string, texto?: string): string {
  const base = `https://wa.me/55${telefone}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/**
 * `exigirTelefone` é falso quando o admin cadastra alguém na mão
 * (quem confirmou de boca nem sempre deixou número).
 */
export function validarResposta(raw: unknown, { exigirTelefone = true } = {}): Resultado {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const erros: Erros = {};

  const responsavel = texto(r.responsavel);
  if (responsavel.length < 2) erros.responsavel = "Informe seu nome.";
  else if (responsavel.length > 80) erros.responsavel = "Nome muito longo.";

  const telefone = normalizarTelefone(texto(r.telefone));
  if (telefone === "" && !exigirTelefone) {
    // ok, sem telefone
  } else if (telefone.length !== 10 && telefone.length !== 11) {
    erros.telefone = "Informe o WhatsApp com DDD, ex.: (21) 99999-9999.";
  }

  const presenca = PRESENCAS.includes(r.presenca as Presenca) ? (r.presenca as Presenca) : null;
  if (!presenca) erros.presenca = "Diga se você vem.";

  const adultos = inteiro(r.adultos) ?? -1;
  if (adultos < 0 || adultos > LIMITES.adultos) erros.adultos = `Entre 0 e ${LIMITES.adultos} adultos.`;

  const recado = texto(r.recado);
  if (recado.length > LIMITES.recado) erros.recado = `Recado com no máximo ${LIMITES.recado} caracteres.`;

  const lista = Array.isArray(r.criancas) ? r.criancas : [];
  if (lista.length > LIMITES.criancas) erros.criancas = `No máximo ${LIMITES.criancas} crianças por resposta.`;

  const vaiNaFesta = presenca === "SIM" || presenca === "TALVEZ";
  const criancas: CriancaInput[] = lista.slice(0, LIMITES.criancas).map((item, i) => {
    const c = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const nome = texto(c.nome);
    if (nome.length < 2) erros[`criancas.${i}.nome`] = "Nome da criança.";
    else if (nome.length > 60) erros[`criancas.${i}.nome`] = "Nome muito longo.";

    const idade = inteiro(c.idade);
    if (idade === null || idade < 0 || idade > LIMITES.idadeMax) erros[`criancas.${i}.idade`] = "Idade de 0 a 17.";

    // Quem não vem à festa não joga; goleiro só faz sentido para quem joga.
    const joga = vaiNaFesta && c.joga === true;
    const id = inteiro(c.id);
    return {
      ...(id !== null && id > 0 ? { id } : {}),
      nome,
      idade: idade ?? 0,
      joga,
      goleiro: joga && c.goleiro === true,
      foto: nomeFotoValido(c.foto) ? c.foto : null,
    };
  });

  if (presenca === "SIM" && adultos + criancas.length === 0) {
    erros.adultos = "Diga quantas pessoas vêm.";
  }

  if (Object.keys(erros).length > 0 || !presenca) return { ok: false, erros };
  return { ok: true, valor: { responsavel, telefone, presenca, adultos, recado, criancas } };
}

/** "Ana Paula Souza" → "Ana Paula S." — como os nomes das crianças aparecem em páginas públicas. */
export function nomePublico(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length <= 1) return partes[0] ?? "";
  if (partes.length === 2) return `${partes[0]} ${partes[1][0]}.`;
  return `${partes[0]} ${partes[1]} ${partes[partes.length - 1][0]}.`;
}
