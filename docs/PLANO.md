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

## Fase 2: o campeonato (até ~28/10)

Só o admin edita; o público vê em `/torneio`.

1. **Times**: quantidade de times e jogadores por time; sorteio equilibrado por nível,
   idade e goleiro; ajuste manual; nome e cor do colete de cada time.
2. **Formato**: grupos + mata-mata, pontos corridos ou só mata-mata.
   Tabela com horários entre 11h e 16h, a partir de campos disponíveis e duração do jogo.
3. **Jogos**: iniciar/encerrar, gol com autor, pênaltis no empate; o chaveamento avança sozinho.
4. **Classificação**: pontos, saldo, gols pró; artilharia.
5. **Página pública ao vivo** (`/torneio`): jogo agora, próximos, tabela, chave, artilheiros,
   campeão. Atualiza sozinha (polling ou SSE), boa para TV no campo.

## Depois

- Hospedagem (Vercel + Neon é o caminho mais curto) e domínio.
- Prazo de confirmação, se quiser.
