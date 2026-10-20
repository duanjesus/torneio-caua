# Torneio do Cauã: plano

Festa de 8 anos do Cauã com campeonato entre as crianças.
**Domingo, 01/11/2026, 11h às 16h, Campo G18 (Estrada da Posse, 755).**

## Decisões

- **Um link geral** para o convite (vai no grupo de WhatsApp). Quem abre preenche os dados.
  Não há lista pré-cadastrada; o admin pode adicionar na mão quem confirmou por fora.
- **Placar público ao vivo** (somente leitura) no dia. Só o admin edita.
- **Roda local por enquanto**; a hospedagem fica para depois.
- Dados de criança: telefones e lista completa só no admin. O que for público mostra
  primeiro nome + inicial do sobrenome (`nomePublico`).

## Fase 1: convite e confirmação ✅

- `/`: convite com a arte, data, local (mapa), agenda e botão "Confirmar presença".
- `/confirmar`: Vou / Talvez / Não vou, nome, WhatsApp, adultos e crianças.
  Cada criança tem "⚽ vai jogar" (vira jogador inscrito) e "🧤 topa ser goleiro".
- `/confirmado/[token]`: resumo da resposta e link para editar (guardado no celular).
- `/admin`: resumo (pessoas, jogadores, talvez, não), compartilhar o convite no WhatsApp,
  idade dos jogadores, últimas respostas.
- `/admin/convidados`: lista com filtro e busca, adicionar/editar/excluir, planilha CSV.
- `/admin/jogadores`: inscritos, nível 1–3 (só o admin vê) e goleiro, tirar do torneio.

## Fase 2: o campeonato ✅

Só o admin edita; o público vê em `/torneio`.

1. **Times** (`/admin/times`): sorteio com os jogadores confirmados; espalha goleiros e
   equilibra por nível e idade (`src/lib/sorteio.ts`). Renomear, trocar cor do colete,
   mover jogador; quem confirmou depois aparece em "Sem time".
2. **Tabela** (`/admin/tabela`): grupos (1, 2 ou 4; 1 grupo = pontos corridos) com 0/1/2/4
   classificados, ou mata-mata direto (com folga quando não fecha potência de 2).
   3º lugar opcional. Horários a partir de início, campos, duração e intervalo; a prévia
   mostra quantos jogos e a hora de término, e avisa se passar das 16h.
   Os grupos são sorteados ao gerar. Botão "Publicar no site" libera `/torneio`.
3. **Jogos** (`/admin/jogos`): começar, gol com autor (ou sem autor, ou contra), apagar gol,
   encerrar (pênaltis obrigatórios em empate no mata-mata), reabrir para corrigir.
   O placar sai dos gols registrados; a chave se preenche sozinha (`src/lib/campeonato.ts`).
4. **Página pública** (`/torneio`): campeão, ao vivo, próximos, classificação, chave,
   artilharia, resultados e times (nomes abreviados). Atualiza a cada 10 s.

Como as fontes da chave funcionam: cada lado do jogo guarda de onde vem o time
(`T:id`, `G:A:1`, `V:7`, `D:7`); jogos ainda não iniciados são recalculados a cada placar.

## Depois

- Hospedagem (Vercel + Neon é o caminho mais curto) e domínio.
- Prazo de confirmação, se quiser.
