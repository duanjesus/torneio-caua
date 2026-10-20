"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { EVENTO } from "@/lib/evento";
import { AvisoEquipamento } from "./aviso-equipamento";
import { FotoCrianca } from "./foto-crianca";
import { LIMITES, type Erros, type Presenca } from "@/lib/resposta";

export type CriancaForm = {
  id?: number;
  chave: string;
  nome: string;
  idade: string;
  joga: boolean;
  goleiro: boolean;
  foto: string | null;
};

export type DadosIniciais = {
  responsavel: string;
  telefone: string;
  presenca: Presenca;
  adultos: number;
  recado: string;
  criancas: { id?: number; nome: string; idade: number; joga: boolean; goleiro: boolean; foto: string | null }[];
};

export type RetornoAcao = { ok: true; destino: string } | { ok: false; erros: Erros };

type Props = {
  inicial?: DadosIniciais;
  acao: (dados: unknown) => Promise<RetornoAcao>;
  /** No painel o telefone é opcional e o texto fala do convidado, não com ele. */
  modo?: "convidado" | "admin";
  textoBotao?: string;
};

let seq = 0;
const novaChave = () => `c${++seq}`;

const OPCOES: { valor: Presenca; rotulo: string; detalhe: string }[] = [
  { valor: "SIM", rotulo: "Vou!", detalhe: "Tô dentro" },
  { valor: "TALVEZ", rotulo: "Talvez", detalhe: "Ainda não sei" },
  { valor: "NAO", rotulo: "Não vou", detalhe: "Não vai dar" },
];

export function FormularioResposta({ inicial, acao, modo = "convidado", textoBotao }: Props) {
  const router = useRouter();
  const admin = modo === "admin";
  const [presenca, setPresenca] = useState<Presenca | null>(inicial?.presenca ?? null);
  const [responsavel, setResponsavel] = useState(inicial?.responsavel ?? "");
  const [telefone, setTelefone] = useState(inicial?.telefone ?? "");
  const [adultos, setAdultos] = useState(inicial?.adultos ?? 1);
  const [recado, setRecado] = useState(inicial?.recado ?? "");
  const [criancas, setCriancas] = useState<CriancaForm[]>(
    () =>
      inicial?.criancas.map((c) => ({ ...c, chave: novaChave(), idade: String(c.idade) })) ?? [],
  );
  const [site, setSite] = useState(""); // isca para robôs; pessoas não veem o campo
  const [erros, setErros] = useState<Erros>({});
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const formulario = useRef<HTMLFormElement>(null);
  const [tentativa, setTentativa] = useState(0);

  // No celular o botão fica lá embaixo e o campo errado, lá em cima: leva a pessoa até o primeiro erro.
  useEffect(() => {
    if (tentativa === 0) return;
    const erro = formulario.current?.querySelector<HTMLElement>(".erro");
    if (!erro) return;
    erro.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    const campo = erro.parentElement?.querySelector<HTMLElement>("input, select, textarea");
    campo?.focus({ preventScroll: true });
  }, [tentativa]);

  const vem = presenca === "SIM" || presenca === "TALVEZ";

  function mudarCrianca(chave: string, campos: Partial<CriancaForm>) {
    setCriancas((lista) => lista.map((c) => (c.chave === chave ? { ...c, ...campos } : c)));
  }

  function adicionarCrianca() {
    const chave = novaChave();
    setCriancas((lista) => [...lista, { chave, nome: "", idade: "", joga: true, goleiro: false, foto: null }]);
  }

  function removerCrianca(chave: string) {
    setCriancas((lista) => lista.filter((c) => c.chave !== chave));
    // Os erros das crianças são por posição; removendo uma, as posições mudam.
    setErros((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("criancas"))));
  }

  /** Some com o erro do campo assim que a pessoa mexe nele. */
  function limpar(chave: string) {
    setErros((e) => {
      if (!(chave in e)) return e;
      const { [chave]: _, ...resto } = e;
      return resto;
    });
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setFalha(null);
    const dados = {
      responsavel,
      telefone,
      presenca,
      adultos: vem ? adultos : 0,
      recado,
      criancas: criancas.map(({ chave: _chave, ...c }) => c),
      site,
    };
    iniciar(async () => {
      try {
        const r = await acao(dados);
        if (r.ok) {
          router.push(r.destino);
          router.refresh();
        } else {
          setErros(r.erros);
          setFalha(r.erros.geral ?? "Confira os campos marcados.");
          setTentativa((n) => n + 1);
        }
      } catch {
        setFalha("Não deu para salvar agora. Tente de novo em instantes.");
      }
    });
  }

  const jogadores = criancas.filter((c) => c.joga).length;

  return (
    <form ref={formulario} onSubmit={enviar} noValidate className="space-y-6">
      <fieldset>
        <legend className="mb-3 flex items-center gap-3">
          <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full bg-fla-500 text-base leading-none text-white">
            1
          </span>
          <span className="font-display text-2xl leading-none tracking-wide">{admin ? "Presença" : "Você vem?"}</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {OPCOES.map((o) => {
            const ativo = presenca === o.valor;
            return (
              <button
                key={o.valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => { setPresenca(o.valor); limpar("presenca"); }}
                className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                  ativo
                    ? "border-fla-500 bg-fla-500 text-white"
                    : "border-campo-600 bg-campo-900 text-zinc-200 hover:bg-campo-800"
                }`}
              >
                <span className="font-display block text-2xl leading-none tracking-wide">{o.rotulo}</span>
                <span className={`mt-1 block text-xs ${ativo ? "text-white/80" : "text-zinc-500"}`}>{o.detalhe}</span>
              </button>
            );
          })}
        </div>
        {erros.presenca && <p className="erro">{erros.presenca}</p>}
      </fieldset>

      <Etapa n={2} titulo={admin ? "Responsável" : "Seus dados"} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="responsavel" className="rotulo">
            {admin ? "Nome do responsável" : "Seu nome"}
          </label>
          <input
            id="responsavel"
            className="campo"
            autoComplete="name"
            value={responsavel}
            onChange={(e) => { setResponsavel(e.target.value); limpar("responsavel"); }}
            maxLength={80}
            placeholder="Nome e sobrenome"
          />
          {erros.responsavel && <p className="erro">{erros.responsavel}</p>}
        </div>
        <div>
          <label htmlFor="telefone" className="rotulo">
            WhatsApp{admin && <span className="text-zinc-500"> (opcional)</span>}
          </label>
          <input
            id="telefone"
            className="campo"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={telefone}
            onChange={(e) => { setTelefone(e.target.value); limpar("telefone"); }}
            placeholder="(21) 99999-9999"
          />
          {erros.telefone && <p className="erro">{erros.telefone}</p>}
        </div>
      </div>

      {vem && (
        <div>
          <span className="rotulo" id="adultos-rotulo">
            {admin ? "Adultos (contando o responsável)" : "Quantos adultos vêm, contando você?"}
          </span>
          <Contador
            rotuloId="adultos-rotulo"
            valor={adultos}
            min={0}
            max={LIMITES.adultos}
            onChange={(n) => { setAdultos(n); limpar("adultos"); }}
          />
          {erros.adultos && <p className="erro">{erros.adultos}</p>}
        </div>
      )}

      {vem && (
        <section className="space-y-3">
          <div>
            <Etapa n={3} titulo="Crianças" />
            <p className="mt-1 text-sm text-zinc-400">
              Liste as crianças que vêm. As marcadas com <strong className="text-zinc-200">“vai jogar”</strong> entram
              no torneio do {EVENTO.aniversariante}.
            </p>
          </div>

          {criancas.map((c, i) => (
            <div key={c.chave} className="cartao space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${c.chave}-nome`} className="rotulo">
                    Nome da criança
                  </label>
                  <input
                    id={`${c.chave}-nome`}
                    className="campo"
                    value={c.nome}
                    maxLength={60}
                    onChange={(e) => { mudarCrianca(c.chave, { nome: e.target.value }); limpar(`criancas.${i}.nome`); }}
                    placeholder="Nome e sobrenome"
                  />
                  {erros[`criancas.${i}.nome`] && <p className="erro">{erros[`criancas.${i}.nome`]}</p>}
                </div>
                <div className="w-24 shrink-0">
                  <label htmlFor={`${c.chave}-idade`} className="rotulo">
                    Idade
                  </label>
                  <select
                    id={`${c.chave}-idade`}
                    className="campo px-2"
                    value={c.idade}
                    onChange={(e) => { mudarCrianca(c.chave, { idade: e.target.value }); limpar(`criancas.${i}.idade`); }}
                  >
                    <option value="">–</option>
                    {Array.from({ length: LIMITES.idadeMax + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n === 0 ? "bebê" : `${n} ${n === 1 ? "ano" : "anos"}`}
                      </option>
                    ))}
                  </select>
                  {erros[`criancas.${i}.idade`] && <p className="erro">{erros[`criancas.${i}.idade`]}</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Alternar
                  ativo={c.joga}
                  onClick={() => mudarCrianca(c.chave, { joga: !c.joga, goleiro: c.joga ? false : c.goleiro })}
                >
                  ⚽ Vai jogar
                </Alternar>
                {c.joga && (
                  <Alternar ativo={c.goleiro} onClick={() => mudarCrianca(c.chave, { goleiro: !c.goleiro })}>
                    🧤 Topa ser goleiro
                  </Alternar>
                )}
                <button
                  type="button"
                  onClick={() => removerCrianca(c.chave)}
                  className="ml-auto rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-campo-800 hover:text-fla-400"
                >
                  Remover
                </button>
              </div>

              {c.joga && (
                <div className="border-t border-campo-700 pt-3">
                  <FotoCrianca nome={c.nome} foto={c.foto} onChange={(foto) => mudarCrianca(c.chave, { foto })} />
                </div>
              )}
            </div>
          ))}

          {erros.criancas && <p className="erro">{erros.criancas}</p>}

          {criancas.length < LIMITES.criancas && (
            <button type="button" onClick={adicionarCrianca} className="btn-secundario w-full border-dashed">
              + Adicionar criança
            </button>
          )}

          {jogadores > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">
                {jogadores === 1 ? "1 criança inscrita" : `${jogadores} crianças inscritas`} no torneio.
              </p>
              <AvisoEquipamento />
            </div>
          )}
        </section>
      )}

      <div>
        <Etapa n={vem ? 4 : 3} titulo="Recado" />
        <label htmlFor="recado" className="rotulo mt-3">
          Recado para o {EVENTO.aniversariante} <span className="text-zinc-500">(opcional)</span>
        </label>
        <textarea
          id="recado"
          className="campo min-h-24"
          value={recado}
          maxLength={LIMITES.recado}
          onChange={(e) => { setRecado(e.target.value); limpar("recado"); }}
          placeholder="Parabéns, craque!"
        />
        {erros.recado && <p className="erro">{erros.recado}</p>}
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] h-0 overflow-hidden">
        <label>
          Site
          <input tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} />
        </label>
      </div>

      {falha && (
        <p role="alert" className="rounded-xl border border-fla-500/40 bg-fla-500/10 px-4 py-3 text-sm text-fla-400">
          {falha}
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn-primario w-full text-lg">
        {enviando ? "Salvando…" : (textoBotao ?? "Enviar resposta")}
      </button>
    </form>
  );
}

function Alternar({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        ativo ? "border-fla-500 bg-fla-500/15 text-white" : "border-campo-600 text-zinc-400 hover:bg-campo-800"
      }`}
    >
      {children}
    </button>
  );
}

function Contador(props: { rotuloId: string; valor: number; min: number; max: number; onChange: (n: number) => void }) {
  const { rotuloId, valor, min, max, onChange } = props;
  return (
    <div className="flex items-center gap-3" role="group" aria-labelledby={rotuloId}>
      <button
        type="button"
        aria-label="Menos um"
        disabled={valor <= min}
        onClick={() => onChange(valor - 1)}
        className="btn-secundario size-12 p-0 text-2xl"
      >
        −
      </button>
      <span className="font-display w-10 text-center text-4xl leading-none" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        aria-label="Mais um"
        disabled={valor >= max}
        onClick={() => onChange(valor + 1)}
        className="btn-secundario size-12 p-0 text-2xl"
      >
        +
      </button>
    </div>
  );
}

/** Cabeçalho numerado de cada parte do formulário. */
function Etapa({ n, titulo }: { n: number; titulo: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-campo-700 pt-5">
      <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full bg-fla-500 text-base leading-none text-white">
        {n}
      </span>
      <h2 className="font-display text-2xl leading-none tracking-wide">{titulo}</h2>
    </div>
  );
}
