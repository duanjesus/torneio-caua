import { iniciais } from "@/lib/escalacao";

/** Texto escuro sobre colete claro (branco, amarelo), claro sobre os demais. */
function corTexto(fundo: string): string {
  const h = fundo.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#111" : "#fff";
}

/** Anel na cor do time e um fio claro por fora: aparece até com colete preto no fundo escuro. */
const contorno = (cor: string) => `0 0 0 2px ${cor}, 0 0 0 3px rgb(255 255 255 / 0.35)`;

/** Foto redonda da criança; sem foto, as iniciais na cor do time. */
export function Avatar({
  nome,
  foto,
  cor = "#34343a",
  className = "size-10",
  textoClassName = "text-sm",
}: {
  nome: string;
  foto: string | null | undefined;
  cor?: string;
  className?: string;
  textoClassName?: string;
}) {
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto servida pela nossa rota, já reduzida
      <img
        src={`/fotos/${foto}`}
        alt={nome}
        loading="lazy"
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ boxShadow: contorno(cor) }}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={nome}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className} ${textoClassName}`}
      style={{ backgroundColor: cor, color: corTexto(cor), boxShadow: contorno(cor) }}
    >
      {iniciais(nome)}
    </span>
  );
}
