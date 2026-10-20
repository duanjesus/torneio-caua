// O link de edição fica guardado no celular de quem respondeu.
// Pode falhar (aba anônima, armazenamento bloqueado): aí só não aparece o atalho.

const CHAVE = "torneio-caua:resposta";

export function lerTokenSalvo(): string | null {
  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function salvarToken(token: string): void {
  try {
    window.localStorage.setItem(CHAVE, token);
  } catch {
    // sem armazenamento, segue sem atalho
  }
}
