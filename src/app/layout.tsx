import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { EVENTO, publicUrl } from "@/lib/evento";
import "./globals.css";

const titulo = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-titulo" });
const texto = Inter({ subsets: ["latin"], variable: "--font-texto" });

export const metadata: Metadata = {
  // A prévia do link no WhatsApp precisa da imagem com endereço completo.
  metadataBase: new URL(publicUrl()),
  title: `${EVENTO.titulo} · ${EVENTO.idade} anos`,
  description: `Você foi convocado! ${EVENTO.diaSemana}, ${EVENTO.dataCurta}, ${EVENTO.horario} no ${EVENTO.local}. Confirme sua presença.`,
  openGraph: {
    title: `Você foi convocado! ${EVENTO.titulo}`,
    description: `${EVENTO.diaSemana}, ${EVENTO.dataCurta} · ${EVENTO.horario} · ${EVENTO.local}`,
    images: ["/convite.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#070707" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
