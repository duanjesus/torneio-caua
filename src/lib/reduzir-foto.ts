// Roda no navegador: transforma a foto do celular (vários MB) num quadrado de 480 px em JPEG,
// com uns 40 KB. Assim o envio é rápido mesmo no 4G e a escalação carrega leve.

export async function reduzirFoto(arquivo: File, lado = 480): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const menor = Math.min(imagem.width, imagem.height);
  const sx = (imagem.width - menor) / 2;
  // Em foto em pé o rosto costuma ficar na parte de cima: corta mais de baixo do que de cima.
  const sy = imagem.height > imagem.width ? (imagem.height - menor) * 0.2 : (imagem.height - menor) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sem canvas");
  ctx.drawImage(imagem, sx, sy, menor, menor, 0, 0, lado, lado);
  imagem.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao converter"))), "image/jpeg", 0.85),
  );
}
