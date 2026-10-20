import { randomBytes } from "node:crypto";
import { db } from "./db";
import type { RespostaInput } from "./resposta";

export function novoToken(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Grava uma resposta nova ou atualiza uma existente. Na edição, crianças que já
 * existiam são atualizadas no lugar (mantêm id e o nível dado pelo admin), as
 * novas são criadas e as que sumiram do formulário são apagadas.
 */
export async function gravarResposta(
  valor: RespostaInput,
  opts: { respostaId?: number; criadoPeloAdmin?: boolean } = {},
): Promise<{ id: number; token: string }> {
  const dados = {
    responsavel: valor.responsavel,
    telefone: valor.telefone,
    presenca: valor.presenca,
    adultos: valor.adultos,
    recado: valor.recado || null,
  };

  if (opts.respostaId === undefined) {
    return db.resposta.create({
      data: {
        ...dados,
        token: novoToken(),
        criadoPeloAdmin: opts.criadoPeloAdmin ?? false,
        criancas: {
          create: valor.criancas.map(({ id: _id, ...c }, ordem) => ({ ...c, ordem })),
        },
      },
      select: { id: true, token: true },
    });
  }

  const respostaId = opts.respostaId;
  return db.$transaction(async (tx) => {
    const atuais = await tx.crianca.findMany({ where: { respostaId }, select: { id: true } });
    const idsAtuais = new Set(atuais.map((c) => c.id));
    const mantidos = new Set<number>();

    for (const [ordem, { id, ...c }] of valor.criancas.entries()) {
      if (id !== undefined && idsAtuais.has(id)) {
        mantidos.add(id);
        // Quem deixou de jogar sai do time em que estava.
        await tx.crianca.update({ where: { id }, data: { ...c, ordem, ...(!c.joga && { timeId: null }) } });
      } else {
        await tx.crianca.create({ data: { ...c, ordem, respostaId } });
      }
    }
    const removidos = [...idsAtuais].filter((id) => !mantidos.has(id));
    if (removidos.length > 0) await tx.crianca.deleteMany({ where: { id: { in: removidos } } });

    return tx.resposta.update({ where: { id: respostaId }, data: dados, select: { id: true, token: true } });
  });
}

export function buscarPorToken(token: string) {
  return db.resposta.findUnique({
    where: { token },
    include: { criancas: { orderBy: { ordem: "asc" } } },
  });
}

export type RespostaCompleta = NonNullable<Awaited<ReturnType<typeof buscarPorToken>>>;

/** Formato que o formulário recebe para editar. */
export function paraFormulario(r: RespostaCompleta) {
  return {
    responsavel: r.responsavel,
    telefone: r.telefone,
    presenca: r.presenca,
    adultos: r.adultos,
    recado: r.recado ?? "",
    criancas: r.criancas.map((c) => ({
      id: c.id,
      nome: c.nome,
      idade: c.idade,
      joga: c.joga,
      goleiro: c.goleiro,
      foto: c.foto,
    })),
  };
}
