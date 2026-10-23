import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { iguais, lerSessao, montarSessao, type Papel } from "./sessao";

const COOKIE = "torneio_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET ausente ou curto demais");
  return s;
}

/**
 * Qual acesso esta senha dá: ADMIN_PASSWORD é o organizador; ADMIN_LEITURA_PASSWORD (opcional)
 * é quem só pode ver a lista de confirmados.
 */
export function papelDaSenha(password: string): Papel | null {
  const admin = process.env.ADMIN_PASSWORD;
  const leitor = process.env.ADMIN_LEITURA_PASSWORD;
  if (admin && iguais(password, admin)) return "admin";
  if (leitor && iguais(password, leitor)) return "leitor";
  return null;
}

export async function createSession(papel: Papel): Promise<void> {
  (await cookies()).set(COOKIE, montarSessao(papel, Date.now() + MAX_AGE_SECONDS * 1000, secret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function papelAtual(): Promise<Papel | null> {
  return lerSessao((await cookies()).get(COOKIE)?.value, secret());
}

/** Só o organizador. O leitor também está logado, mas aqui conta como de fora. */
export async function isAdmin(): Promise<boolean> {
  return (await papelAtual()) === "admin";
}

/**
 * Toda página e toda server action do painel começa por aqui: só o organizador passa.
 * O leitor é mandado para a lista de confirmados; quem não entrou, para o login.
 */
export async function requireAdmin(): Promise<void> {
  const papel = await papelAtual();
  if (papel === "admin") return;
  redirect(papel === "leitor" ? "/admin/lista" : "/admin/login");
}

/** Lista de confirmados: organizador ou leitor. */
export async function requireLeitura(): Promise<Papel> {
  const papel = await papelAtual();
  if (!papel) redirect("/admin/login");
  return papel;
}
