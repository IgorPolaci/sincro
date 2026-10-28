"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Sincro global error", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="grid min-h-screen place-items-center p-6">
          <section className="max-w-md text-center">
            <h1 className="text-2xl font-bold">O Sincro encontrou um problema</h1>
            <p className="mt-2 text-sm">Nenhuma operação foi confirmada automaticamente.</p>
            <button
              className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white"
              type="button"
              onClick={retry}
            >
              Tentar novamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
