import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCredits } from "@/hooks/useCredits";
import { Sparkles, Lock, ArrowRight, Wand2, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/generator")({
  head: () => ({
    meta: [
      { title: "Generator Produktu AI — 90 Dni" },
      {
        name: "description",
        content:
          "Wygeneruj pomysł, ofertę, landing page, maile i reklamy do swojego produktu online. Konkretne narzędzia AI, nie chatbot.",
      },
    ],
  }),
  component: GeneratorListPage,
});

type Generator = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  credit_cost: number;
  supports_quality_modes: boolean;
  position: number;
  required_plan: string | null;
};

const CATEGORIES: Record<string, { label: string; color: string }> = {
  idea: { label: "Pomysł", color: "bg-blue-soft text-blue" },
  strategy: { label: "Strategia", color: "bg-violet-soft text-violet" },
  sales: { label: "Sprzedaż", color: "bg-orange/20 text-orange" },
  ads: { label: "Reklamy", color: "bg-green/20 text-green" },
  general: { label: "Ogólne", color: "bg-muted text-muted-foreground" },
};

function GeneratorListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { credits } = useCredits();
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [loading, setLoading] = useState(true);
  const isGeneratorIndex = location.pathname === "/generator";

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!isGeneratorIndex) return;
    (async () => {
      const { data } = await supabase
        .from("ai_generators")
        .select("id,name,slug,description,category,credit_cost,supports_quality_modes,position,required_plan")
        .eq("status", "active")
        .order("position");
      setGenerators(data ?? []);
      setLoading(false);
    })();
  }, [isGeneratorIndex]);

  if (!isGeneratorIndex) {
    return <Outlet />;
  }

  return (
    <PageShell
      title="Generator Produktu AI"
      subtitle="Konkretne narzędzia do stworzenia pomysłu, oferty, landing page, maili i reklam"
    >
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5 shadow-soft flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-bold text-lg">Twoje kredyty AI</div>
            <div className="text-sm text-muted-foreground">Wykorzystaj je do stworzenia pełnego pakietu sprzedażowego</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-display font-extrabold text-3xl text-violet leading-none">
              {credits?.available ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">dostępnych kredytów</div>
          </div>
          <Link
            to="/credits"
            className="px-4 py-2 rounded-xl bg-card border border-border font-semibold text-sm hover:bg-muted"
          >
            Dokup kredyty
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Ładowanie generatorów…</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {generators.map((g) => {
            const cat = CATEGORIES[g.category ?? "general"] ?? CATEGORIES.general;
            const enough = (credits?.available ?? 0) >= g.credit_cost;
            return (
              <Link
                key={g.id}
                to="/generator/$slug"
                params={{ slug: g.slug }}
                className="group rounded-3xl border border-border bg-card p-5 shadow-soft hover:shadow-glow hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
                    {cat.label}
                  </span>
                  {g.supports_quality_modes && (
                    <Badge variant="outline" className="text-[10px]">
                      <Crown className="w-3 h-3 mr-1" /> Premium dostępny
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-violet" />
                  <h3 className="font-display font-bold text-base">{g.name}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground flex-1">{g.description}</p>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-sm">
                    <Sparkles className="w-4 h-4 text-violet" />
                    <span className="font-semibold">{g.credit_cost}</span>
                    <span className="text-muted-foreground">kredytów</span>
                  </div>
                  <span className={`text-sm font-semibold inline-flex items-center gap-1 ${enough ? "text-violet group-hover:translate-x-0.5 transition-transform" : "text-muted-foreground"}`}>
                    {enough ? (
                      <>
                        Wygeneruj <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Brak kredytów
                      </>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange/20 grid place-items-center text-orange">
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Potrzebujesz więcej kredytów?</div>
          <div className="text-sm text-muted-foreground">Przejdź na PRO SPRZEDAŻ lub VIP, aby zyskać więcej kredytów AI co miesiąc.</div>
        </div>
        <Link to="/pricing" className="px-4 py-2 rounded-xl bg-gradient-violet text-primary-foreground font-semibold text-sm">
          Zobacz pakiety
        </Link>
      </div>
    </PageShell>
  );
}
