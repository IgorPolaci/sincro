"use client";
import { useState, useTransition } from "react";
import { DatabaseZap, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { populateDemoData, populateSneakerDemoStore } from "./actions";
export function DemoDataButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  function load() {
    startTransition(async () => {
      const state = await populateDemoData();
      setMessage(state.error ?? state.success);
    });
  }
  return (
    <div>
      <Button type="button" variant="secondary" disabled={pending} onClick={load}>
        <DatabaseZap className="h-4 w-4" />
        {pending ? "Carregando…" : "Carregar dados de demonstração"}
      </Button>
      {message && (
        <p role="status" className="text-muted mt-2 text-xs">
          {message}
        </p>
      )}
    </div>
  );
}

export function SneakerDemoDataButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  function load() {
    startTransition(async () => {
      const state = await populateSneakerDemoStore();
      setMessage(state.error ?? state.success);
    });
  }
  return (
    <div>
      <Button type="button" disabled={pending} onClick={load}>
        <ShoppingBag className="h-4 w-4" />
        {pending ? "Criando loja…" : "Criar loja de tênis"}
      </Button>
      {message && (
        <p role="status" className="text-muted mt-2 text-xs">
          {message}
        </p>
      )}
    </div>
  );
}
