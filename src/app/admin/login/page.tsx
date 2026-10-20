"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "../actions";

export default function Login() {
  const [erro, entrar, entrando] = useActionState(login, null);
  return (
    <main className="riscos flex min-h-screen items-center justify-center px-4">
      <form action={entrar} className="cartao w-full max-w-sm space-y-4 p-6">
        <Image src="/escudo.jpg" alt="" width={96} height={96} className="mx-auto size-24 rounded-xl" />
        <h1 className="font-display text-center text-3xl tracking-wide">Painel do torneio</h1>
        <div>
          <label htmlFor="senha" className="rotulo">
            Senha
          </label>
          <input id="senha" name="senha" type="password" autoComplete="current-password" className="campo" autoFocus />
          {erro && <p className="erro">{erro}</p>}
        </div>
        <button type="submit" disabled={entrando} className="btn-primario w-full">
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
