"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export type DemoState = { error?: string; success?: string };
export async function populateDemoData(): Promise<DemoState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("populate_demo_data");
  if (error)
    return {
      error: "Não foi possível carregar a massa de demonstração. Verifique se você possui permissão de administrador.",
    };
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/clientes");
  revalidatePath("/estoque");
  revalidatePath("/ecommerce");
  return { success: (data as { message?: string })?.message ?? "Massa de demonstração carregada." };
}

export async function populateSneakerDemoStore(): Promise<DemoState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("populate_sneaker_demo_store");
  if (error)
    return {
      error:
        "Não foi possível criar a loja de tênis. Aplique a migration mais recente e confirme sua permissão de administrador.",
    };
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/clientes");
  revalidatePath("/estoque");
  revalidatePath("/ecommerce");
  revalidatePath("/ecommerce/produtos");
  revalidatePath("/delivery");
  return { success: (data as { message?: string })?.message ?? "Loja de tênis de demonstração criada." };
}
