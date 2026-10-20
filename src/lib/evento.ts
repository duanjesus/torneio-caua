/** Dados da festa. Tudo que aparece no convite sai daqui. */
export const EVENTO = {
  aniversariante: "Cauã",
  idade: 8,
  titulo: "Torneio do Cauã",
  data: "2026-11-01",
  dataCurta: "01/11",
  diaSemana: "Domingo",
  inicio: "11:00",
  fim: "16:00",
  horario: "11h às 16h",
  local: "Campo G18",
  endereco: "Estrada da Posse, 755",
  cidade: "Rio de Janeiro",
  aviso: "O bar do campo estará disponível para compra de bebidas.",
  /** Prazo para confirmar presença (vale até o fim do dia, horário de Brasília). */
  confirmarAte: "2026-10-30",
  prazoTexto: "sexta, 30/10",
} as const;

/**
 * Depois do prazo o formulário continua aceitando respostas (sempre aparece alguém
 * em cima da hora), mas avisa que a inscrição no torneio depende de vaga.
 */
export function prazoEncerrado(agora = new Date()): boolean {
  return agora >= new Date(`${EVENTO.confirmarAte}T23:59:59-03:00`);
}

export const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${EVENTO.local}, ${EVENTO.endereco}, ${EVENTO.cidade}`,
)}`;

/** Link "adicionar ao Google Agenda" com o horário de Brasília (UTC-3, sem horário de verão). */
export function agendaUrl(): string {
  const utc = (hora: string) => {
    const [h, m] = hora.split(":").map(Number);
    return `${EVENTO.data.replaceAll("-", "")}T${String(h + 3).padStart(2, "0")}${String(m).padStart(2, "0")}00Z`;
  };
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${EVENTO.titulo} · ${EVENTO.idade} anos`,
    dates: `${utc(EVENTO.inicio)}/${utc(EVENTO.fim)}`,
    location: `${EVENTO.local}, ${EVENTO.endereco}, ${EVENTO.cidade}`,
    details: EVENTO.aviso,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function publicUrl(): string {
  return (process.env.PUBLIC_URL || "http://localhost:3030").replace(/\/+$/, "");
}

export function mensagemConvite(): string {
  return [
    `⚽ Você foi convocado! ⚽`,
    ``,
    `${EVENTO.titulo} · ${EVENTO.idade} anos`,
    `📅 ${EVENTO.diaSemana}, ${EVENTO.dataCurta} · ${EVENTO.horario}`,
    `📍 ${EVENTO.local} · ${EVENTO.endereco}`,
    ``,
    `Confirme até ${EVENTO.prazoTexto} e inscreva as crianças que vão jogar:`,
    publicUrl(),
  ].join("\n");
}
