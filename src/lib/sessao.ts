// Cookie de sessão do painel: "<expira>.<papel>.<assinatura>". Puro, para dar para testar.
// O papel vai assinado junto com a validade: trocar "leitor" por "admin" no cookie invalida a assinatura.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type Papel = "admin" | "leitor";

function assinar(conteudo: string, segredo: string): string {
  return createHmac("sha256", segredo).update(conteudo).digest("hex");
}

export function iguais(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function montarSessao(papel: Papel, expiraEm: number, segredo: string): string {
  const conteudo = `${expiraEm}.${papel}`;
  return `${conteudo}.${assinar(conteudo, segredo)}`;
}

/** Papel de quem tem este cookie, ou null se ele for inválido, adulterado ou vencido. */
export function lerSessao(valor: string | undefined, segredo: string, agora = Date.now()): Papel | null {
  if (!valor) return null;
  const partes = valor.split(".");
  // Formato antigo "<expira>.<assinatura>", de antes de existir o leitor: era sempre o admin.
  if (partes.length === 2) {
    const [expira, assinatura] = partes;
    if (!iguais(assinatura, assinar(expira, segredo))) return null;
    return Number(expira) > agora ? "admin" : null;
  }
  if (partes.length !== 3) return null;
  const [expira, papel, assinatura] = partes;
  if (papel !== "admin" && papel !== "leitor") return null;
  if (!iguais(assinatura, assinar(`${expira}.${papel}`, segredo))) return null;
  return Number(expira) > agora ? papel : null;
}
