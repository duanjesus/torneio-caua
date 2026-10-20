import Image from "next/image";
import QRCode from "qrcode";
import { AtualizarSozinho } from "@/components/atualizar-sozinho";
import { CampoInteiro } from "@/components/escalacao";
import { CorTime, rotuloJogo } from "@/components/torneio-ui";
import { CelebracaoGol, CronometroTv, Relogio, Rotacao, TelaCheia, type GolRecente } from "@/components/tv";
import { EVENTO, publicUrl } from "@/lib/evento";
import { carregarLances, type LanceView } from "@/lib/lances";
import { nomePublico } from "@/lib/resposta";
import { ROTULO_FASE, rotuloFonte, type Fase } from "@/lib/tabela";
import { embedYoutube } from "@/lib/video";
import { carregarTorneio, type DadosTorneio, type JogoCompleto } from "@/lib/torneio";

export const dynamic = "force-dynamic";
export const metadata = { title: `TV · ${EVENTO.titulo}`, robots: { index: false } };

// Tudo medido em vw: a tela se ajusta a qualquer TV 16:9 sem rolar.

type Times = DadosTorneio["timePorId"];

export default async function ModoTv() {
  const [t, lances] = await Promise.all([carregarTorneio(), carregarLances()]);
  const qr = await QRCode.toString(`${publicUrl()}/torneio`, {
    type: "svg",
    margin: 1,
    color: { dark: "#0f0f10", light: "#ffffff" },
  });

  return (
    <main className="riscos fixed inset-0 flex flex-col overflow-hidden bg-campo-950 text-white">
      <AtualizarSozinho segundos={5} />
      <header className="flex items-center gap-[1.2vw] border-b border-campo-700 px-[2.5vw] py-[1vw]">
        <Image src="/escudo.jpg" alt="" width={160} height={160} className="h-[4.5vw] w-[4.5vw] rounded-[0.6vw]" priority />
        <h1 className="font-display text-[3vw] leading-none tracking-wide">
          <span className="text-fla-500">Torneio</span> do {EVENTO.aniversariante}
          <span className="ml-[1vw] text-[1.6vw] text-zinc-500">{EVENTO.idade} anos</span>
        </h1>
        <div className="ml-auto flex items-center gap-[1.5vw] text-[2.6vw] leading-none">
          <TelaCheia />
          <Relogio />
        </div>
      </header>

      {t.config.publicado ? <Placar t={t} qr={qr} lances={lances} /> : <EmBreve qr={qr} />}
      {t.config.publicado && <CelebracaoGol gol={golMaisRecente(t)} />}
    </main>
  );
}

function EmBreve({ qr }: { qr: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-[5vw]">
      <div className="text-center">
        <p className="titulo-pincel text-[8vw] leading-none text-fla-500">Em breve</p>
        <p className="mt-[1vw] text-[1.8vw] text-zinc-300">Os times e a tabela aparecem aqui quando a bola rolar.</p>
      </div>
      <Qr svg={qr} />
    </div>
  );
}

/** O último gol registrado (maior id), já com o placar do jogo, para a comemoração na TV. */
function golMaisRecente(t: DadosTorneio): GolRecente | null {
  let achado: { jogo: JogoCompleto; gol: JogoCompleto["gols"][number] } | null = null;
  for (const jogo of t.jogos) for (const gol of jogo.gols) if (!achado || gol.id > achado.gol.id) achado = { jogo, gol };
  if (!achado) return null;
  const { jogo, gol } = achado;
  const time = t.timePorId.get(gol.timeId);
  const nome = (id: number | null) => (id ? (t.timePorId.get(id)?.nome ?? "?") : "?");
  return {
    id: gol.id,
    autor: gol.crianca ? nomePublico(gol.crianca.nome) : null,
    foto: gol.crianca?.foto ?? null,
    contra: gol.contra,
    time: time?.nome ?? "",
    cor: time?.cor ?? "#e10600",
    placar: `${nome(jogo.timeAId)} ${jogo.golsA} x ${jogo.golsB} ${nome(jogo.timeBId)}`,
  };
}

function Placar({ t, qr, lances }: { t: DadosTorneio; qr: string; lances: LanceView[] }) {
  const aoVivo = t.jogos.filter((j) => j.status === "AO_VIVO");
  const proximos = t.jogos.filter((j) => j.status === "AGENDADO");
  const encerrados = t.jogos.filter((j) => j.status === "ENCERRADO").reverse();
  const mataMata = t.jogos.filter((j) => j.fase !== "GRUPOS");
  const campeao = t.campeaoId ? t.timePorId.get(t.campeaoId) : null;

  // Painéis da direita: só entra o que tem conteúdo.
  const paineis: { titulo: string; conteudo: React.ReactNode; segundos?: number }[] = [];
  // Replay: o lance mais recente que dá para tocar na TV (YouTube), por 30 s.
  const replay = lances.find((l) => l.video.tipo === "youtube");
  if (replay) paineis.push({ titulo: "Replay", conteudo: <PainelReplay lance={replay} />, segundos: 30 });
  // Escalação do jogo em destaque (o que está rolando ou o próximo), quando os dois times já são conhecidos.
  const destaque = aoVivo[0] ?? proximos[0];
  const timeA = destaque?.timeAId ? t.timePorId.get(destaque.timeAId) : null;
  const timeB = destaque?.timeBId ? t.timePorId.get(destaque.timeBId) : null;
  if (timeA && timeB) {
    paineis.push({ titulo: "Escalação", conteudo: <CampoInteiro timeA={timeA} timeB={timeB} /> });
  }
  if (Object.keys(t.classificacao).length > 0) {
    paineis.push({ titulo: "Classificação", conteudo: <PainelClassificacao t={t} /> });
  }
  if (mataMata.length > 0) paineis.push({ titulo: "Mata-mata", conteudo: <PainelChave jogos={mataMata} times={t.timePorId} /> });
  if (proximos.length > 0) {
    paineis.push({
      titulo: "Próximos",
      conteudo: <PainelLista titulo="Próximos jogos" jogos={proximos.slice(0, 6)} times={t.timePorId} />,
    });
  }
  if (encerrados.length > 0) {
    paineis.push({
      titulo: "Resultados",
      conteudo: <PainelLista titulo="Últimos resultados" jogos={encerrados.slice(0, 6)} times={t.timePorId} />,
    });
  }
  if (t.artilharia.length > 0) paineis.push({ titulo: "Artilharia", conteudo: <PainelArtilharia t={t} /> });
  paineis.push({ titulo: "Times", conteudo: <PainelTimes t={t} /> });

  return (
    <div className="flex min-h-0 flex-1 gap-[2vw] p-[2vw]">
      <section className="flex w-[38%] min-w-0 flex-col gap-[1.5vw]">
        {campeao ? (
          <Campeao nome={campeao.nome} cor={campeao.cor} jogadores={campeao.jogadores.map((j) => nomePublico(j.nome))} />
        ) : aoVivo.length > 0 ? (
          <>
            {aoVivo.slice(0, 2).map((j) => (
              <JogoGrande key={j.id} jogo={j} times={t.timePorId} duracao={t.config.duracao} />
            ))}
            {aoVivo.length === 1 && proximos[0] && (
              <div>
                <p className="mb-[0.5vw] text-[1.2vw] text-zinc-400">A seguir</p>
                <LinhaJogo jogo={proximos[0]} times={t.timePorId} />
              </div>
            )}
          </>
        ) : proximos[0] ? (
          <JogoGrande jogo={proximos[0]} times={t.timePorId} duracao={t.config.duracao} />
        ) : null}
        <div className="mt-auto flex items-center gap-[1.5vw] rounded-[1vw] border border-campo-700 bg-campo-900 p-[1.2vw]">
          <Qr svg={qr} pequeno />
          <p className="text-[1.4vw] leading-snug text-zinc-300">
            Acompanhe no celular: aponte a câmera para o código.
          </p>
        </div>
      </section>

      <section className="min-w-0 flex-1">
        <Rotacao titulos={paineis.map((p) => p.titulo)} duracoes={paineis.map((p) => p.segundos ?? 12)}>
          {paineis.map((p) => (
            <div key={p.titulo} className="h-full">
              {p.conteudo}
            </div>
          ))}
        </Rotacao>
      </section>
    </div>
  );
}

function Qr({ svg, pequeno = false }: { svg: string; pequeno?: boolean }) {
  return (
    <div
      aria-label="Código QR do site do torneio"
      role="img"
      className={`shrink-0 overflow-hidden rounded-[0.6vw] bg-white p-[0.4vw] [&>svg]:h-full [&>svg]:w-full ${
        pequeno ? "h-[8vw] w-[8vw]" : "h-[18vw] w-[18vw]"
      }`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function nomeLado(jogo: JogoCompleto, lado: "A" | "B", times: Times) {
  const id = lado === "A" ? jogo.timeAId : jogo.timeBId;
  const time = id ? times.get(id) : null;
  return { time, rotulo: time?.nome ?? rotuloFonte(lado === "A" ? jogo.fonteA : jogo.fonteB) };
}

function JogoGrande({ jogo, times, duracao }: { jogo: JogoCompleto; times: Times; duracao: number }) {
  const aoVivo = jogo.status === "AO_VIVO";
  const lados = (["A", "B"] as const).map((l) => ({ ...nomeLado(jogo, l, times), gols: l === "A" ? jogo.golsA : jogo.golsB }));

  return (
    <div className={`rounded-[1.2vw] border p-[1.5vw] ${aoVivo ? "border-fla-500 bg-fla-500/[0.07]" : "border-campo-700 bg-campo-900"}`}>
      <div className="flex items-center justify-between text-[1.2vw] text-zinc-400">
        <span>
          Jogo {jogo.numero} · {rotuloJogo(jogo)}
        </span>
        {aoVivo ? (
          <span className="flex items-center gap-[0.6vw] rounded-full bg-fla-500 px-[0.8vw] py-[0.2vw] font-bold uppercase text-white">
            <span className="size-[0.6vw] animate-pulse rounded-full bg-white" /> Ao vivo
          </span>
        ) : (
          <span className="font-display text-[1.6vw] text-white">Próximo · {jogo.horario}</span>
        )}
      </div>
      <div className="mt-[1vw] space-y-[0.6vw]">
        {lados.map((l, k) => (
          <div key={k} className="flex items-center gap-[1vw]">
            <span
              className="h-[3.5vw] w-[0.8vw] shrink-0 rounded-full ring-1 ring-white/30"
              style={{ backgroundColor: l.time?.cor ?? "#3f3f46" }}
            />
            <span className={`min-w-0 flex-1 truncate text-[2.2vw] font-semibold ${l.time ? "" : "italic text-zinc-500"}`}>{l.rotulo}</span>
            <span className="font-display text-[5vw] leading-none tabular-nums">{aoVivo ? l.gols : ""}</span>
          </div>
        ))}
      </div>
      {aoVivo && jogo.iniciadoEm && (
        <div className="mt-[0.8vw] text-center text-[2.4vw]">
          <CronometroTv desde={jogo.iniciadoEm.toISOString()} duracao={duracao} />
        </div>
      )}
    </div>
  );
}

function Campeao({ nome, cor, jogadores }: { nome: string; cor: string; jogadores: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[1.2vw] border border-fla-500 bg-campo-900 p-[2vw] text-center">
      <div className="absolute inset-x-0 top-0 h-[0.6vw]" style={{ backgroundColor: cor }} />
      <p className="font-display text-[2vw] tracking-widest text-zinc-400">👑 Campeão 👑</p>
      <p className="titulo-pincel mt-[0.5vw] text-[5.5vw] leading-none text-fla-500">{nome}</p>
      <p className="mt-[1vw] text-[1.3vw] leading-relaxed text-zinc-300">{jogadores.join(" · ")}</p>
    </div>
  );
}

function TituloPainel({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display mb-[1vw] text-[2.6vw] leading-none tracking-wide">{children}</h2>;
}

function PainelClassificacao({ t }: { t: DadosTorneio }) {
  const grupos = Object.entries(t.classificacao);
  return (
    <div className="flex h-full flex-col">
      <TituloPainel>Classificação</TituloPainel>
      <div className={`grid min-h-0 flex-1 gap-[1.5vw] ${grupos.length > 1 ? "grid-cols-2" : ""}`}>
        {grupos.map(([g, linhas]) => (
          <div key={g} className="rounded-[1vw] border border-campo-700 bg-campo-900 p-[1vw]">
            {grupos.length > 1 && <p className="font-display mb-[0.5vw] text-[1.8vw] text-zinc-400">Grupo {g}</p>}
            <table className="w-full text-[1.5vw]">
              <thead className="text-[1vw] text-zinc-500">
                <tr>
                  <th className="w-[2vw] text-left font-normal">#</th>
                  <th className="text-left font-normal">Time</th>
                  <th className="w-[3vw] text-center font-semibold text-zinc-300">P</th>
                  <th className="w-[2.5vw] text-center font-normal">J</th>
                  <th className="w-[3vw] text-center font-normal">SG</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => {
                  const time = t.timePorId.get(l.timeId);
                  return (
                    <tr key={l.timeId} className="border-t border-campo-700">
                      <td className={`py-[0.5vw] ${i < t.config.classificados ? "font-bold text-fla-400" : "text-zinc-500"}`}>{i + 1}</td>
                      <td className="max-w-0 py-[0.5vw]">
                        <span className="flex items-center gap-[0.6vw]">
                          {time && <CorTime cor={time.cor} className="size-[1.2vw]" />}
                          <span className="truncate">{time?.nome}</span>
                        </span>
                      </td>
                      <td className="text-center font-bold tabular-nums">{l.pts}</td>
                      <td className="text-center tabular-nums text-zinc-400">{l.j}</td>
                      <td className="text-center tabular-nums text-zinc-400">{l.sg > 0 ? `+${l.sg}` : l.sg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinhaJogo({ jogo, times }: { jogo: JogoCompleto; times: Times }) {
  const comecou = jogo.status !== "AGENDADO";
  const pen = jogo.penaltisA !== null && jogo.penaltisB !== null;
  const lado = (l: "A" | "B") => {
    const { time, rotulo } = nomeLado(jogo, l, times);
    return (
      <span className={`flex min-w-0 flex-1 items-center gap-[0.6vw] ${l === "B" ? "flex-row-reverse text-right" : ""}`}>
        {time && <CorTime cor={time.cor} className="size-[1.2vw]" />}
        <span className={`truncate ${time ? "" : "italic text-zinc-500"}`}>{rotulo}</span>
      </span>
    );
  };
  return (
    <div className="flex items-center gap-[1vw] rounded-[0.8vw] border border-campo-700 bg-campo-900 px-[1.2vw] py-[0.8vw] text-[1.5vw]">
      <span className="font-display w-[5vw] shrink-0 text-[1.6vw] text-zinc-400">{jogo.horario}</span>
      {lado("A")}
      <span className="font-display shrink-0 text-center text-[2vw] tabular-nums">
        {comecou ? `${jogo.golsA} x ${jogo.golsB}` : "x"}
        {pen && (
          <span className="block text-[0.9vw] text-zinc-500">
            pên. {jogo.penaltisA}-{jogo.penaltisB}
          </span>
        )}
      </span>
      {lado("B")}
    </div>
  );
}

function PainelLista({ titulo, jogos, times }: { titulo: string; jogos: JogoCompleto[]; times: Times }) {
  return (
    <div className="flex h-full flex-col">
      <TituloPainel>{titulo}</TituloPainel>
      <div className="space-y-[0.8vw]">
        {jogos.map((j) => (
          <LinhaJogo key={j.id} jogo={j} times={times} />
        ))}
      </div>
    </div>
  );
}

const ORDEM: Fase[] = ["OITAVAS", "QUARTAS", "SEMI", "FINAL"];

function PainelChave({ jogos, times }: { jogos: JogoCompleto[]; times: Times }) {
  const fases = ORDEM.filter((f) => jogos.some((j) => j.fase === f));
  const terceiro = jogos.find((j) => j.fase === "TERCEIRO");
  return (
    <div className="flex h-full flex-col">
      <TituloPainel>Mata-mata</TituloPainel>
      <div className="flex min-h-0 flex-1 gap-[1.5vw]">
        {fases.map((f) => (
          <div key={f} className="flex min-w-0 flex-1 flex-col">
            <p className="mb-[0.6vw] text-[1.2vw] text-zinc-400">{ROTULO_FASE[f]}</p>
            <div className="flex flex-1 flex-col justify-around gap-[1vw]">
              {jogos
                .filter((j) => j.fase === f)
                .map((j) => (
                  <CaixaChave key={j.id} jogo={j} times={times} />
                ))}
              {f === "FINAL" && terceiro && (
                <div>
                  <p className="mb-[0.6vw] text-[1.2vw] text-zinc-400">{ROTULO_FASE.TERCEIRO}</p>
                  <CaixaChave jogo={terceiro} times={times} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaixaChave({ jogo, times }: { jogo: JogoCompleto; times: Times }) {
  const comecou = jogo.status !== "AGENDADO";
  const encerrado = jogo.status === "ENCERRADO";
  const pen = jogo.penaltisA !== null && jogo.penaltisB !== null;
  const venceu = (l: "A" | "B") => {
    if (!encerrado) return false;
    const [a, b] = [jogo.golsA, jogo.golsB];
    if (a !== b) return l === "A" ? a > b : b > a;
    return pen && (l === "A" ? jogo.penaltisA! > jogo.penaltisB! : jogo.penaltisB! > jogo.penaltisA!);
  };
  return (
    <div
      className={`rounded-[0.8vw] border px-[1vw] py-[0.7vw] text-[1.4vw] ${
        jogo.status === "AO_VIVO" ? "border-fla-500 bg-fla-500/[0.07]" : "border-campo-700 bg-campo-900"
      }`}
    >
      {(["A", "B"] as const).map((l) => {
        const { time, rotulo } = nomeLado(jogo, l, times);
        const gols = l === "A" ? jogo.golsA : jogo.golsB;
        const p = l === "A" ? jogo.penaltisA : jogo.penaltisB;
        return (
          <div key={l} className={`flex items-center gap-[0.6vw] ${venceu(l) ? "font-bold" : encerrado ? "text-zinc-400" : ""}`}>
            {time && <CorTime cor={time.cor} className="size-[1.1vw]" />}
            <span className={`min-w-0 flex-1 truncate ${time ? "" : "italic text-zinc-500"}`}>{rotulo}</span>
            {pen && <span className="text-[1vw] text-zinc-500">({p})</span>}
            <span className="font-display w-[2vw] text-right text-[1.8vw] tabular-nums">{comecou ? gols : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

function PainelArtilharia({ t }: { t: DadosTorneio }) {
  return (
    <div className="flex h-full flex-col">
      <TituloPainel>Artilharia</TituloPainel>
      <ol className="grid grid-cols-2 gap-x-[2vw] gap-y-[0.8vw] text-[1.8vw]">
        {t.artilharia.slice(0, 10).map((a, i) => {
          const time = t.timePorId.get(a.timeId);
          return (
            <li key={a.criancaId} className="flex items-center gap-[0.8vw] rounded-[0.8vw] border border-campo-700 bg-campo-900 px-[1vw] py-[0.6vw]">
              <span className="w-[2vw] text-right text-zinc-500">{i + 1}</span>
              {time && <CorTime cor={time.cor} className="size-[1.2vw]" />}
              <span className="min-w-0 flex-1 truncate">{nomePublico(a.nome)}</span>
              <span className="font-display text-[2.4vw] leading-none text-fla-400">{a.gols}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PainelTimes({ t }: { t: DadosTorneio }) {
  const colunas = t.times.length > 6 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className="flex h-full flex-col">
      <TituloPainel>Times</TituloPainel>
      <div className={`grid gap-[1vw] ${colunas}`}>
        {t.times.map((time) => (
          <div key={time.id} className="overflow-hidden rounded-[0.8vw] border border-campo-700 bg-campo-900">
            <div className="h-[0.4vw]" style={{ backgroundColor: time.cor }} />
            <div className="p-[0.8vw]">
              <p className="text-[1.5vw] font-semibold">{time.nome}</p>
              <p className="mt-[0.3vw] text-[1.05vw] leading-snug text-zinc-400">
                {time.jogadores.map((j) => nomePublico(j.nome) + (j.goleiro ? " 🧤" : "")).join(" · ")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PainelReplay({ lance }: { lance: LanceView }) {
  if (lance.video.tipo !== "youtube") return null;
  return (
    <div className="flex h-full flex-col">
      <div className="mb-[1vw] flex items-baseline gap-[1vw]">
        <h2 className="font-display text-[2.6vw] leading-none tracking-wide text-fla-500">Replay</h2>
        <p className="truncate text-[1.6vw] font-semibold">{lance.titulo}</p>
        {lance.subtitulo && <p className="truncate text-[1.2vw] text-zinc-400">{lance.subtitulo}</p>}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1vw] bg-black">
        <iframe
          src={embedYoutube(lance.video.id, { tv: true })}
          title={lance.titulo}
          allow="autoplay; encrypted-media"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
