-- Ponto de partida de cada rodada do Marreta: famílias que já responderam, com 16 crianças
-- inscritas, para o organizador ter com quem sortear os times desde o primeiro minuto.
insert into "Resposta" (id, token, responsavel, telefone, presenca, adultos, "criadoPeloAdmin", "atualizadoEm") values
  (1, 'semente-01', 'Família Semente 1', '21900000001', 'SIM', 2, false, now()),
  (2, 'semente-02', 'Família Semente 2', '21900000002', 'SIM', 1, false, now()),
  (3, 'semente-03', 'Família Semente 3', '21900000003', 'SIM', 2, false, now()),
  (4, 'semente-04', 'Família Semente 4', '21900000004', 'SIM', 2, false, now()),
  (5, 'semente-05', 'Família Semente 5', '21900000005', 'SIM', 3, false, now()),
  (6, 'semente-06', 'Família Semente 6', '21900000006', 'SIM', 1, false, now()),
  (7, 'semente-07', 'Família Semente 7', '21900000007', 'SIM', 2, false, now()),
  (8, 'semente-08', 'Família Semente 8', '21900000008', 'SIM', 2, false, now()),
  (9, 'semente-09', 'Família Semente 9', '21900000009', 'SIM', 2, false, now()),
  (10, 'semente-10', 'Família Semente 10', '21900000010', 'SIM', 1, false, now()),
  (11, 'semente-11', 'Família Semente 11', '21900000011', 'TALVEZ', 2, false, now()),
  (12, 'semente-12', 'Família Semente 12', '', 'TALVEZ', 1, true, now()),
  (13, 'semente-13', 'Família Semente 13', '21900000013', 'NAO', 0, false, now());
select setval(pg_get_serial_sequence('"Resposta"', 'id'), (select max(id) from "Resposta"));

insert into "Crianca" ("respostaId", nome, idade, joga, goleiro, nivel, ordem) values
  (1, 'Arthur Semente', 8, true, false, 3, 0),
  (1, 'Alice Semente', 5, false, false, null, 1),
  (2, 'Bernardo Semente', 7, true, true, 2, 0),
  (3, 'Caio Semente', 8, true, false, 2, 0),
  (3, 'Clara Semente', 9, true, false, 1, 1),
  (4, 'Davi Semente', 6, true, false, 1, 0),
  (5, 'Enzo Semente', 8, true, true, 3, 0),
  (5, 'Eduardo Semente', 10, true, false, 3, 1),
  (6, 'Felipe Semente', 7, true, false, null, 0),
  (7, 'Gael Semente', 8, true, false, 2, 0),
  (7, 'Gabriel Semente', 6, true, false, 1, 1),
  (8, 'Heitor Semente', 9, true, true, 2, 0),
  (9, 'Isaac Semente', 8, true, false, 2, 0),
  (9, 'Iris Semente', 4, false, false, null, 1),
  (10, 'João Semente', 7, true, false, null, 0),
  (10, 'Joana Semente', 8, true, false, 2, 1),
  (10, 'José Semente', 9, true, false, 3, 2),
  (11, 'Kauã Semente', 8, true, false, null, 0),
  (12, 'Lia Semente', 6, true, false, null, 0),
  (13, 'Miguel Semente', 8, false, false, null, 0);
