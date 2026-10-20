// Fotos das crianças. Em produção ficam num Blob store PRIVADO da Vercel: o arquivo não tem
// endereço público, quem entrega é a rota /fotos/<nome> do próprio site. Em desenvolvimento
// (ou sem token) ficam na pasta .uploads/, fora do git.

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { nomeFotoValido } from "./resposta";

const PASTA_LOCAL = path.join(process.cwd(), ".uploads");
const PREFIXO_BLOB = "fotos/";
export const TAMANHO_MAXIMO = 2 * 1024 * 1024;

const TIPOS = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
type Extensao = keyof typeof TIPOS;

function usarBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.NODE_ENV !== "development";
}

/** Confere os primeiros bytes: só aceita imagem de verdade, não importa o nome do arquivo. */
export function tipoDaImagem(b: Uint8Array): Extensao | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  const riff = String.fromCharCode(...b.slice(0, 4));
  const webp = String.fromCharCode(...b.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "webp";
  return null;
}

/** Guarda a imagem e devolve o nome gerado, ou null se não for imagem. */
export async function salvarFoto(bytes: Uint8Array): Promise<string | null> {
  const ext = tipoDaImagem(bytes);
  if (!ext || bytes.byteLength > TAMANHO_MAXIMO) return null;
  const nome = `${randomBytes(16).toString("base64url")}.${ext}`;
  if (usarBlob()) {
    await put(PREFIXO_BLOB + nome, Buffer.from(bytes), {
      access: "private",
      contentType: TIPOS[ext],
      addRandomSuffix: false,
    });
  } else {
    await mkdir(PASTA_LOCAL, { recursive: true });
    await writeFile(path.join(PASTA_LOCAL, nome), bytes);
  }
  return nome;
}

export async function lerFoto(nome: string): Promise<{ corpo: BodyInit; tipo: string } | null> {
  if (!nomeFotoValido(nome)) return null;
  const tipo = TIPOS[nome.split(".").pop() as Extensao];
  if (usarBlob()) {
    const r = await get(PREFIXO_BLOB + nome, { access: "private" });
    if (!r || r.statusCode !== 200) return null;
    return { corpo: r.stream, tipo };
  }
  try {
    return { corpo: new Uint8Array(await readFile(path.join(PASTA_LOCAL, nome))), tipo };
  } catch {
    return null;
  }
}
