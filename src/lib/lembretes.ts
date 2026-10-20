// Mensagens de lembrete para o WhatsApp. Puro, para dar para testar.

import { EVENTO } from "./evento.ts";

export type TipoLembrete = "talvez" | "vespera";

/** "Mariana Souza" → "Mariana"; mas "Família Souza" fica inteiro (senão viraria "Oi, Família!"). */
export function primeiroNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (/^fam[ií]lia$/i.test(partes[0] ?? "") && partes.length > 1) return partes.join(" ");
  return partes[0] ?? "";
}

/** Junta nomes: "Ana", "Ana e Bia", "Ana, Bia e Caio". */
export function juntarNomes(nomes: string[]): string {
  if (nomes.length <= 1) return nomes[0] ?? "";
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** Para quem marcou "talvez": leva o link da própria resposta, para mudar com um toque. */
export function mensagemTalvez(r: { responsavel: string; token: string }, urlBase: string): string {
  return [
    `Oi, ${primeiroNome(r.responsavel)}! ⚽`,
    ``,
    `Você marcou "talvez" para o ${EVENTO.titulo} (${EVENTO.diaSemana.toLowerCase()}, ${EVENTO.dataCurta}, ${EVENTO.horario}, no ${EVENTO.local}).`,
    `Consegue confirmar até ${EVENTO.prazoTexto}? Depois disso a gente sorteia os times.`,
    ``,
    `É só abrir e mudar a resposta:`,
    `${urlBase}/confirmar?t=${r.token}`,
  ].join("\n");
}

/** Véspera, para quem confirmou: horário, lugar e, se tem criança jogando, o equipamento. */
export function mensagemVespera(r: { responsavel: string; jogadores: string[] }, urlBase: string): string {
  const linhas = [
    `Oi, ${primeiroNome(r.responsavel)}! Amanhã é o ${EVENTO.titulo}! 🎉⚽`,
    ``,
    `📅 ${EVENTO.diaSemana}, ${EVENTO.dataCurta} · ${EVENTO.horario}`,
    `📍 ${EVENTO.local} · ${EVENTO.endereco}`,
  ];
  if (r.jogadores.length > 0) {
    const nomes = juntarNomes(r.jogadores.map(primeiroNome));
    linhas.push(
      ``,
      `${r.jogadores.length === 1 ? `${nomes} está escalado` : `${nomes} estão escalados`}! 👟 Venham de chuteira, meião e caneleira: o campo não permite jogar descalço.`,
    );
  }
  linhas.push(``, `Times, tabela e placar ao vivo: ${urlBase}/torneio`);
  return linhas.join("\n");
}
