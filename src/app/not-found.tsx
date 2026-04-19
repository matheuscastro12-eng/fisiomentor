import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-display-lg text-primary mb-4">404</p>
        <h1 className="font-display text-headline-lg text-on-surface mb-3">
          Página não encontrada
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mb-8">
          O recurso que você procura não existe ou foi movido.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-on-primary font-medium text-body-md transition-all hover:shadow-ambient-md"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
