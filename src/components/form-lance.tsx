"use client";

import { useMemo, useState, useTransition } from "react";
import { adicionarLance } from "@/app/admin/lances-actions";
import { analisarVideo, miniaturaYoutube, rotuloLink } from "@/lib/video";

export type JogoOpcao = {
  id: number;
  rotulo: string;
  gols: { id: number; rotulo: string }[];
};

export function FormLance({ jogos, jogoInicial }: { jogos: JogoOpcao[]; jogoInicial: number | null }) {
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [jogoId, setJogoId] = useState<number | null>(jogoInicial);
  const [golId, setGolId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, iniciar] = useTransition();

  const video = useMemo(() => analisarVideo(url), [url]);
  const gols = jogos.find((j) => j.id === jogoId)?.gols ?? [];

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvo(false);
    iniciar(async () => {
      const r = await adicionarLance({ url, titulo, jogoId, golId });
      if (r.ok) {
        setUrl("");
        setTitulo("");
        setGolId(null);
        setSalvo(true);
      } else setErro(r.erro);
    });
  }

  return (
    <form onSubmit={salvar} className="cartao space-y-4 p-5">
      <div>
        <label htmlFor="url-lance" className="rotulo">
          Link do vídeo
        </label>
        <input
          id="url-lance"
          className="campo"
          inputMode="url"
          placeholder="https://youtu.be/… ou o link do Lance Replay"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSalvo(false);
          }}
        />
        {url && !video && <p className="erro">Esse link não parece um vídeo. Cole o link completo, começando com https.</p>}
        {video?.tipo === "youtube" && (
          // eslint-disable-next-line @next/next/no-img-element -- prévia da miniatura do YouTube
          <img src={miniaturaYoutube(video.id)} alt="Prévia do vídeo" className="mt-3 aspect-video w-full max-w-sm rounded-xl object-cover" />
        )}
        {video?.tipo === "link" && <p className="mt-2 text-sm text-zinc-400">No site vai aparecer o botão “{rotuloLink(video.host)}”.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="jogo-lance" className="rotulo">
            Jogo <span className="text-zinc-500">(opcional)</span>
          </label>
          <select
            id="jogo-lance"
            className="campo"
            value={jogoId ?? ""}
            onChange={(e) => {
              setJogoId(e.target.value ? Number(e.target.value) : null);
              setGolId(null);
            }}
          >
            <option value="">Sem jogo</option>
            {jogos.map((j) => (
              <option key={j.id} value={j.id}>
                {j.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gol-lance" className="rotulo">
            Gol <span className="text-zinc-500">(opcional)</span>
          </label>
          <select
            id="gol-lance"
            className="campo"
            value={golId ?? ""}
            disabled={gols.length === 0}
            onChange={(e) => setGolId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{jogoId && gols.length === 0 ? "Jogo sem gols" : "Não é gol / não sei"}</option>
            {gols.map((g) => (
              <option key={g.id} value={g.id}>
                {g.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="titulo-lance" className="rotulo">
          Título <span className="text-zinc-500">(opcional; sem título, usa o gol ou o jogo)</span>
        </label>
        <input
          id="titulo-lance"
          className="campo"
          maxLength={80}
          placeholder="Ex.: Defesaça do Pedro"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      {erro && <p className="erro">{erro}</p>}
      {salvo && <p className="text-sm text-emerald-400">Lance adicionado. Já aparece no site e na TV.</p>}
      <button type="submit" disabled={pendente || !video} className="btn-primario w-full sm:w-auto">
        {pendente ? "Salvando…" : "Adicionar lance"}
      </button>
    </form>
  );
}
