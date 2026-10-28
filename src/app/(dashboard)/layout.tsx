import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layouts/app-header";
import { SetupRequired } from "@/components/shared/setup-required";
import { isSupabaseConfigured } from "@/lib/env";
import { requireProfile } from "@/lib/auth";
import { getBusinessUnitContext } from "@/lib/business-units";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const [profile, unitContext] = await Promise.all([requireProfile(), getBusinessUnitContext()]);
  if (!unitContext.hasSelection) redirect("/selecionar-negocio");
  const organization = profile.organizations as unknown as { name: string } | null;
  return (
    <div className="dashboard-shell min-h-screen">
      <AppHeader
        name={profile.name}
        organization={organization?.name ?? "Organização"}
        currentUnit={unitContext.current}
      />
      <main className="dashboard-main mx-auto max-w-[1180px] space-y-6 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
