import Link from "next/link";
import { CartaoJogo } from "@/components/torneio-ui";
import { carregarTorneio } from "@/lib/torneio";

export const dynamic = "force-dynamic";

export default async function Jogos() {
  const t = await carregarTorneio();
  if (t.jogos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-4xl tracking-wide">Jogos</h1>
        <p className="cartao p-6 text-zinc-400">
          Nenhum jogo ainda. Gere a tabela em{" "}
          <Link href="/admin/tabela" className="text-fla-400 hover:underline">
            Tabela
          </Link>
          .
        </p>
      </div>
    );
  }

  const aoVivo = t.jogos.filter((j) => j.status === "AO_VIVO");
  const proximos = t.jogos.filter((j) => j.status === "AGENDADO");
  const encerrados = t.jogos.filter((j) => j.status === "ENCERRADO").reverse();
  const href = (j: { id: number }) => `/admin/jogos/${j.id}`;
  const lista = (titulo: string, jogos: typeof t.jogos, destaque = false) =>
    jogos.length > 0 && (
      <section className="space-y-3">
        <h2 className={`font-display text-2xl tracking-wide ${destaque ? "text-fla-500" : ""}`}>
          {titulo} <span className="text-zinc-500">({jogos.length})</span>
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {jogos.map((j) => (
            <CartaoJogo key={j.id} jogo={j} timePorId={t.timePorId} href={href(j)} />
          ))}
        </div>
      </section>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-4xl tracking-wide">Jogos</h1>
        <p className="text-sm text-zinc-400">
          {encerrados.length} de {t.jogos.length} encerrados
        </p>
      </div>
      <p className="text-sm text-zinc-400">Toque num jogo para começar, marcar gols e encerrar.</p>
      {lista("Rolando agora", aoVivo, true)}
      {lista("Próximos", proximos)}
      {lista("Encerrados", encerrados)}
    </div>
  );
}
