// Escalação desenhada em campo, com a foto (ou as iniciais) de cada criança.

import { montarEscalacao } from "@/lib/escalacao";
import { nomePublico } from "@/lib/resposta";
import { Avatar } from "./avatar";

export type JogadorEscalacao = { id: number; nome: string; goleiro: boolean; foto: string | null };
export type TimeEscalacao = { nome: string; cor: string; jogadores: JogadorEscalacao[] };

const GRAMA = "bg-[#1b1c1e]";
const LINHA = "border-white/15";

function Jogador({ j, cor, tv }: { j: JogadorEscalacao; cor: string; tv: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center ${tv ? "gap-[0.3vw]" : "gap-1"}`}>
      <Avatar
        nome={j.nome}
        foto={j.foto}
        cor={cor}
        className={tv ? "size-[4.2vw]" : "size-11"}
        textoClassName={tv ? "text-[1.3vw]" : "text-xs"}
      />
      <span
        className={`max-w-full truncate rounded px-1 font-semibold text-white ${
          tv ? "text-[1vw]" : "text-[11px] leading-tight"
        }`}
      >
        {nomePublico(j.nome)}
      </span>
    </div>
  );
}

/** Meio campo em pé (gol embaixo), para o card de cada time no celular. */
export function MeioCampo({ time }: { time: TimeEscalacao }) {
  const { goleiro, fileiras } = montarEscalacao(time.jogadores);
  const linhas = goleiro ? [[goleiro], ...fileiras] : fileiras;
  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-xl border ${LINHA} ${GRAMA}`}>
      {/* meio-campo no topo, área e pequena área embaixo */}
      <div className={`absolute -top-[18%] left-1/2 aspect-square w-[36%] -translate-x-1/2 rounded-full border ${LINHA}`} />
      <div className={`absolute inset-x-0 top-0 border-t ${LINHA}`} />
      <div className={`absolute bottom-0 left-1/2 h-[18%] w-[56%] -translate-x-1/2 border border-b-0 ${LINHA}`} />
      <div className={`absolute bottom-0 left-1/2 h-[7%] w-[26%] -translate-x-1/2 border border-b-0 ${LINHA}`} />
      <div className="absolute inset-0 flex flex-col-reverse justify-around px-2 py-3">
        {linhas.map((fileira, i) => (
          <div key={i} className="flex justify-around gap-1">
            {fileira.map((j) => (
              <Jogador key={j.id} j={j} cor={time.cor} tv={false} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Metade({ time, lado }: { time: TimeEscalacao; lado: "esquerda" | "direita" }) {
  const { goleiro, fileiras } = montarEscalacao(time.jogadores);
  const colunas = goleiro ? [[goleiro], ...fileiras] : fileiras;
  return (
    <div
      className={`absolute inset-y-0 flex w-1/2 justify-around px-[1vw] py-[1.5vw] ${
        lado === "esquerda" ? "left-0 flex-row" : "right-0 flex-row-reverse"
      }`}
    >
      {colunas.map((coluna, i) => (
        <div key={i} className="flex flex-col justify-around">
          {coluna.map((j) => (
            <Jogador key={j.id} j={j} cor={time.cor} tv />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Campo inteiro deitado com os dois times frente a frente, para a TV. */
export function CampoInteiro({ timeA, timeB }: { timeA: TimeEscalacao; timeB: TimeEscalacao }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-[0.8vw] flex items-center justify-between text-[1.8vw] font-semibold">
        {[timeA, timeB].map((t, i) => (
          <span key={i} className={`flex items-center gap-[0.6vw] ${i === 1 ? "flex-row-reverse" : ""}`}>
            <span className="h-[1.6vw] w-[0.5vw] rounded-full" style={{ backgroundColor: t.cor }} />
            {t.nome}
          </span>
        ))}
      </div>
      <div className={`relative min-h-0 flex-1 overflow-hidden rounded-[1vw] border ${LINHA} ${GRAMA}`}>
        <div className={`absolute inset-y-0 left-1/2 border-l ${LINHA}`} />
        <div className={`absolute left-1/2 top-1/2 aspect-square h-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border ${LINHA}`} />
        <div className={`absolute left-0 top-1/2 h-[50%] w-[13%] -translate-y-1/2 border border-l-0 ${LINHA}`} />
        <div className={`absolute right-0 top-1/2 h-[50%] w-[13%] -translate-y-1/2 border border-r-0 ${LINHA}`} />
        <Metade time={timeA} lado="esquerda" />
        <Metade time={timeB} lado="direita" />
      </div>
    </div>
  );
}
