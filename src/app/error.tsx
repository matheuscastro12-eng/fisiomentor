"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-error" />
        </div>
        <h1 className="font-display text-headline-lg text-on-surface mb-3">
          Algo deu errado
        </h1>
        <p className="font-body text-body-md text-on-surface-variant mb-2">
          Ocorreu um erro inesperado. Tente recarregar a página.
        </p>
        {error.message && (
          <p className="text-label-sm font-mono text-error/60 mb-6 bg-error/5 rounded-xl px-4 py-2">
            {error.message}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container text-on-surface font-medium text-body-md hover:bg-surface-container-high transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-on-primary font-medium text-body-md transition-all hover:shadow-ambient-md"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
