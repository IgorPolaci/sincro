"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorRetryProps = {
  error: Error & { digest?: string };
  retry: () => void;
  compact?: boolean;
};

export function ErrorRetry({ error, retry, compact = false }: ErrorRetryProps) {
  useEffect(() => {
    console.error("Sincro page error", error);
  }, [error]);

  return (
    <main className={`grid ${compact ? "min-h-[280px]" : "min-h-screen"} place-items-center p-6`}>
      <section className="max-w-md text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle />
        </span>
        <h1 className="mt-4 text-xl font-bold">Não foi possível carregar esta tela</h1>
        <p className="mt-2 text-sm text-muted">
          Sua operação não foi alterada. Tente novamente em alguns instantes.
        </p>
        <Button className="mt-5" type="button" onClick={retry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}
