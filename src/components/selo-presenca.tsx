const ESTILO = {
  SIM: "bg-emerald-500/15 text-emerald-400",
  TALVEZ: "bg-amber-500/15 text-amber-400",
  NAO: "bg-zinc-500/15 text-zinc-400",
} as const;

const TEXTO = { SIM: "Vai", TALVEZ: "Talvez", NAO: "Não vai" } as const;

export function SeloPresenca({ presenca }: { presenca: keyof typeof ESTILO }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ESTILO[presenca]}`}>{TEXTO[presenca]}</span>
  );
}
