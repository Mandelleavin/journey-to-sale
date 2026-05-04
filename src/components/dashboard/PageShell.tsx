import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { MobileTopNav } from "@/components/dashboard/MobileTopNav";
import { AdvisorButton } from "@/components/dashboard/AdvisorButton";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function PageShell({
  title,
  subtitle,
  children,
  showAdvisor = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showAdvisor?: boolean;
}) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState<string | undefined>();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { count }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);
      setFullName(prof?.full_name ?? undefined);
      setNotifCount(count ?? 0);
    })();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0 space-y-5">
          <MobileTopNav />
          <TopBar fullName={fullName} notificationsCount={notifCount} />
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h1 className="font-display font-extrabold text-2xl text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
      {showAdvisor && <AdvisorButton />}
    </div>
  );
}
