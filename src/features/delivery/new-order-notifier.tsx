"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const preferenceKey = "sincro:new-order-sound";

export function NewOrderNotifier({ businessUnitId }: { businessUnitId: string }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  useEffect(() => {
    const timeout = window.setTimeout(() => setEnabled(localStorage.getItem(preferenceKey) === "on"), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`new-orders:${businessUnitId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "online_orders", filter: `business_unit_id=eq.${businessUnitId}` },
        () => {
          router.refresh();
          if (enabled) playNotification(audioContext);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessUnitId, enabled, router]);
  function toggle() {
    const next = !enabled;
    if (next) {
      const Context = window.AudioContext ?? window.webkitAudioContext;
      audioContext.current ??= new Context();
      void audioContext.current.resume();
      playNotification(audioContext);
    }
    setEnabled(next);
    localStorage.setItem(preferenceKey, next ? "on" : "off");
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"
    >
      {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      {enabled ? "Som ativado" : "Ativar som"}
    </button>
  );
}

function playNotification(contextRef: React.MutableRefObject<AudioContext | null>) {
  const Context = window.AudioContext ?? window.webkitAudioContext;
  const context = contextRef.current ?? new Context();
  contextRef.current = context;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(1175, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.34);
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
