import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="riscos flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="titulo-pincel text-7xl text-fla-500">Impedido!</p>
      <p className="text-zinc-300">Essa página não existe ou o link está incompleto.</p>
      <Link href="/" className="btn-primario">
        Ir para o convite
      </Link>
    </main>
  );
}
