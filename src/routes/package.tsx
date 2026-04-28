import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Sparkles } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/package")({
  head: () => ({
    meta: [
      { title: "Mój pakiet — 90 Dni" },
      { name: "description", content: "Twoje aktualne członkostwo w programie 90 Dni do pierwszej sprzedaży." },
    ],
  }),
  component: PackagePage,
});

function PackagePage() {
  const { user } = useAuth();
  const data = useDashboardData();

  const features = [
    "Pełny dostęp do wszystkich kursów",
    "Indywidualne zadania od mentora",
    "Cotygodniowy kontakt z doradcą",
    "Społeczność uczestników",
    "System nagród za zdobywane XP",
    "Hot lead — priorytetowy kontakt sprzedażowy",
  ];

  return (
    <PageShell title="Mój pakiet" subtitle="Szczegóły Twojego aktualnego członkostwa">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-6 shadow-soft">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Badge variant="outline" className="border-violet/40 text-violet mb-2">
              Aktywne
            </Badge>
            <h2 className="font-display font-extrabold text-2xl">Pakiet 90 Dni — Pełny</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.email}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <CreditCard className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-card border border-border p-3">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Poziom</div>
            <div className="font-display font-extrabold text-2xl text-violet">{data.level}</div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">XP łącznie</div>
            <div className="font-display font-extrabold text-2xl">{data.totalXp}</div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Kursy</div>
            <div className="font-display font-extrabold text-2xl">{data.courses.length}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Co zawiera Twój pakiet</h2>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Konto</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-semibold">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <Badge variant="outline" className="border-green/40 text-green">Aktywny</Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <Link to="/profile">
            <Button variant="outline">Edytuj profil</Button>
          </Link>
          <Link to="/advisor">
            <Button className="bg-gradient-violet text-primary-foreground">
              <Sparkles className="w-4 h-4 mr-1" /> Skontaktuj się z doradcą
            </Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
