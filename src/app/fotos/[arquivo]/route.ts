import { lerFoto } from "@/lib/fotos";

/**
 * Entrega a foto. O nome tem 128 bits aleatórios e só aparece nas páginas onde a foto
 * é mostrada (a própria resposta, o painel e o torneio publicado).
 */
export async function GET(_: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const foto = await lerFoto((await params).arquivo);
  if (!foto) return new Response("Não encontrada", { status: 404 });
  return new Response(foto.corpo, {
    headers: {
      "Content-Type": foto.tipo,
      // O nome nunca é reaproveitado: trocar a foto gera outro arquivo.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex",
    },
  });
}
