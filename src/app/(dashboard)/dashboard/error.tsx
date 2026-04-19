"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto py-16">
      <Card className="bg-surface-container-low">
        <CardContent className="flex flex-col items-center text-center py-12">
          <div className="h-14 w-14 rounded-xl bg-error/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-error" />
          </div>
          <h2 className="font-display text-title-lg text-on-surface mb-2">
            Erro ao carregar
          </h2>
          <p className="text-body-sm text-on-surface-variant mb-2 max-w-sm">
            Não foi possível carregar esta página. Verifique sua conexão e tente novamente.
          </p>
          {error.message && (
            <p className="text-label-sm font-mono text-error/60 mb-4 bg-error/5 rounded-lg px-3 py-1.5">
              {error.message}
            </p>
          )}
          <Button onClick={reset} variant="secondary" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
