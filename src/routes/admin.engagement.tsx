import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  getAdminEngagementList,
  adminRecalcEngagement,
  type EngagementRow,
} from "@/lib/engagement.functions";
import { getPlanFeatures, type PlanFeatureRow } from "@/lib/plan-gating.functions";
import { updatePlanFeature } from "@/lib/engagement.functions";
import { Flame, RefreshCw, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/engagement")({
  component: AdminEngagementPage,
});

const LABEL_COLOR: Record<string, string> = {
  cold: "bg-blue-soft text-blue",
  warm: "bg-violet-soft text-violet",
  hot: "bg-orange/20 text-orange",
  on_fire: "bg-gradient-violet text-white",
};

function AdminEngagementPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange" />
          Engagement i limity planów
        </h1>
        <p className="text-muted-foreground mt-1">
          Lista użytkowników wg zaangażowania oraz konfiguracja limitów planów.
        </p>
      </header>
      <EngagementList />
      <PlanFeaturesEditor />
    </div>
  );
}

function EngagementList() {
  const fn = useServerFn(getAdminEngagementList);
  const recalc = useServerFn(adminRecalcEngagement);
  const qc = useQueryClient();
  const [label, setLabel] = useState<"all" | "cold" | "warm" | "hot" | "on_fire">("all");
  const [plan, setPlan] = useState<"all" | "start" | "pro" | "vip">("all");

  const q = useQuery({
    queryKey: ["admin-engagement", label, plan],
    queryFn: () => fn({ data: { label, plan, limit: 200 } }),
  });

  const m = useMutation({
    mutationFn: (targetUserId: string) => recalc({ data: { targetUserId } }),
    onSuccess: () => {
      toast.success("Przeliczono score");
      qc.invalidateQueries({ queryKey: ["admin-engagement"] });
    },
  });

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-xl font-bold mr-auto">Użytkownicy wg zaangażowania</h2>
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value as typeof label)}
          className="rounded-lg border px-3 py-2 text-sm bg-background"
        >
          <option value="all">Wszystkie etykiety</option>
          <option value="on_fire">🔥 On fire (75+)</option>
          <option value="hot">Hot (50+)</option>
          <option value="warm">Warm (25+)</option>
          <option value="cold">Cold</option>
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as typeof plan)}
          className="rounded-lg border px-3 py-2 text-sm bg-background"
        >
          <option value="all">Wszystkie plany</option>
          <option value="start">START</option>
          <option value="pro">PRO</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      {q.isLoading ? (
        <div className="py-8 text-center text-muted-foreground flex justify-center">
          <Loader2 className="animate-spin w-5 h-5" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-4">Użytkownik</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Etykieta</th>
                <th className="py-2 pr-4">Składowe</th>
                <th className="py-2 pr-4">Last seen</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(q.data?.rows ?? []).map((r: EngagementRow) => (
                <tr key={r.user_id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{r.full_name || r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" className="uppercase">
                      {r.plan ?? "start"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-bold text-lg">{r.score}</div>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-violet"
                        style={{ width: `${Math.min(100, r.score)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${LABEL_COLOR[r.label]}`}
                    >
                      {r.label === "on_fire" ? "🔥 on fire" : r.label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground max-w-[260px]">
                    A:{r.breakdown.activity ?? 0}/15 · S:{r.breakdown.streak ?? 0}/15 · K:
                    {r.breakdown.course ?? 0}/20 · M:{r.breakdown.mentor ?? 0}/15 · P:
                    {r.breakdown.product ?? 0}/25 · Ank:{r.breakdown.survey ?? 0}/10
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">
                    {r.last_seen ? new Date(r.last_seen).toLocaleDateString("pl-PL") : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => m.mutate(r.user_id)}
                        disabled={m.isPending}
                        title="Przelicz score"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Zobacz profil">
                        <Link to="/u/$userId" params={{ userId: r.user_id }}>
                          <Phone className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(q.data?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Brak userów spełniających filtry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlanFeaturesEditor() {
  const fn = useServerFn(getPlanFeatures);
  const update = useServerFn(updatePlanFeature);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["plan-features-admin"], queryFn: () => fn() });

  const m = useMutation({
    mutationFn: (row: PlanFeatureRow) =>
      update({
        data: {
          plan: row.plan,
          feature_key: row.feature_key,
          limit_value: row.limit_value,
          is_enabled: row.is_enabled,
        },
      }),
    onSuccess: () => {
      toast.success("Zapisano");
      qc.invalidateQueries({ queryKey: ["plan-features-admin"] });
      qc.invalidateQueries({ queryKey: ["plan-features"] });
    },
  });

  if (q.isLoading) return null;

  // Group by feature_key
  const features = q.data?.features ?? [];
  const keys = Array.from(new Set(features.map((f) => f.feature_key)));

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <h2 className="text-xl font-bold mb-4">Limity planów</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-2 pr-4">Funkcja</th>
              <th className="py-2 pr-4">START</th>
              <th className="py-2 pr-4">PRO</th>
              <th className="py-2">VIP</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <div className="font-medium">
                    {features.find((f) => f.feature_key === key)?.label ?? key}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{key}</div>
                </td>
                {(["start", "pro", "vip"] as const).map((plan) => {
                  const row = features.find(
                    (f) => f.feature_key === key && f.plan === plan,
                  );
                  if (!row) return <td key={plan}>—</td>;
                  return (
                    <td key={plan} className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={row.is_enabled}
                          onCheckedChange={(v) =>
                            m.mutate({ ...row, is_enabled: v })
                          }
                        />
                        <Input
                          type="number"
                          className="w-20 h-8"
                          defaultValue={row.limit_value}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isNaN(v) && v !== row.limit_value) {
                              m.mutate({ ...row, limit_value: v });
                            }
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground mt-3">
          Limit <span className="font-mono">-1</span> = bez limitu, <span className="font-mono">0</span> +
          wyłączony przełącznik = brak dostępu na tym planie.
        </p>
      </div>
    </section>
  );
}
