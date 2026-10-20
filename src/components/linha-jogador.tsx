"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { atualizarJogador, definirFoto, tirarDoTorneio } from "@/app/admin/actions";
import { FotoCrianca } from "./foto-crianca";

type Props = {
  id: number;
  nome: string;
  idade: number;
  nivel: number | null;
  goleiro: boolean;
  talvez: boolean;
  responsavel: string;
  respostaId: number;
  foto: string | null;
};

export function LinhaJogador(props: Props) {
  const [, iniciar] = useTransition();
  const [estado, otimista] = useOptimistic(
    { nivel: props.nivel, goleiro: props.goleiro },
    (atual, mudanca: { nivel?: number | null; goleiro?: boolean }) => ({ ...atual, ...mudanca }),
  );

  function mudar(mudanca: { nivel?: number | null; goleiro?: boolean }) {
    iniciar(async () => {
      otimista(mudanca);
      await atualizarJogador(props.id, mudanca);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <FotoCrianca compacto nome={props.nome} foto={props.foto} onChange={(foto) => iniciar(() => definirFoto(props.id, foto))} />
      <div className="min-w-0 flex-1 basis-40">
        <p className="font-medium">
          {props.nome} <span className="text-zinc-500">· {props.idade} anos</span>
          {props.talvez && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">talvez</span>}
        </p>
        <Link href={`/admin/convidados/${props.respostaId}`} className="text-xs text-zinc-500 hover:text-zinc-300">
          com {props.responsavel}
        </Link>
      </div>

      <div className="flex items-center gap-1" role="group" aria-label={`Nível de ${props.nome}`}>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={estado.nivel === n}
            onClick={() => mudar({ nivel: estado.nivel === n ? null : n })}
            className={`font-display size-9 rounded-lg border text-lg leading-none ${
              estado.nivel === n
                ? "border-fla-500 bg-fla-500 text-white"
                : "border-campo-600 text-zinc-400 hover:bg-campo-800"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-pressed={estado.goleiro}
        onClick={() => mudar({ goleiro: !estado.goleiro })}
        className={`rounded-full border px-3 py-1.5 text-sm ${
          estado.goleiro ? "border-fla-500 bg-fla-500/15 text-white" : "border-campo-600 text-zinc-500 hover:bg-campo-800"
        }`}
      >
        🧤 Goleiro
      </button>

      <button
        type="button"
        onClick={() => {
          if (confirm(`Tirar ${props.nome} do torneio? A criança continua na lista de convidados.`)) {
            iniciar(() => tirarDoTorneio(props.id));
          }
        }}
        className="rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:bg-campo-800 hover:text-fla-400"
      >
        Tirar
      </button>
    </li>
  );
}
