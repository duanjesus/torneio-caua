import { EVENTO } from "@/lib/evento";

const ICONE: Record<string, string> = { Chuteira: "👟", Meião: "🧦", Caneleira: "🛡️" };

/** Regra do campo (sem jogar descalço) e o que trazer. */
export function AvisoEquipamento({ grande = false }: { grande?: boolean }) {
  return (
    <div className={`rounded-2xl border border-amber-500/50 bg-amber-500/10 ${grande ? "p-5" : "p-4"}`}>
      <p className={`font-semibold text-amber-200 ${grande ? "text-lg" : "text-sm"}`}>
        🚫 O campo não permite jogar descalço
      </p>
      <p className={`mt-1 text-zinc-300 ${grande ? "" : "text-sm"}`}>Quem for entrar em campo precisa vir com:</p>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
        {EVENTO.equipamento.map((item) => (
          <li key={item} className="rounded-xl bg-campo-900/80 px-2 py-2">
            <span aria-hidden="true" className={`block ${grande ? "text-3xl" : "text-2xl"}`}>
              {ICONE[item]}
            </span>
            <span className={`font-medium text-white ${grande ? "text-base" : "text-sm"}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
