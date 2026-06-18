import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import { CalculatorShell, fmtPLN, fmtNum } from "./CalculatorShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getToolHistory, saveToolResult } from "@/lib/tools.functions";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const SLUG = "revenue-potential";

const chartConfig = {
  revenue: {
    label: "Przychód",
    color: "var(--violet)",
  },
} satisfies ChartConfig;

export function RevenuePotentialCalc() {
  const [price, setPrice] = useState(297);
  const [traffic, setTraffic] = useState(1000);
  const [cr, setCr] = useState(2);

  const monthly = useMemo(() => (price * traffic * cr) / 100, [price, traffic, cr]);
  const yearly = monthly * 12;
  const breakdown = useMemo(
    () => Array.from({ length: 12 }, (_, i) => Math.round(monthly * (1 + i * 0.05))),
    [monthly],
  );
  const forecastData = useMemo(
    () =>
      breakdown.map((revenue, index) => ({
        month: `${index + 1}`,
        revenue,
      })),
    [breakdown],
  );

  const qc = useQueryClient();
  const save = useServerFn(saveToolResult);
  const history = useServerFn(getToolHistory);
  const { data: hist } = useQuery({
    queryKey: ["tool-history", SLUG],
    queryFn: () => history({ data: { tool_slug: SLUG, limit: 5 } }),
  });

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          tool_slug: SLUG,
          inputs: { price, traffic, cr },
          outputs: { monthly, yearly },
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.xpAwarded > 0 ? `Zapisano! +${res.xpAwarded} XP 🔥` : "Zapisano wynik");
        qc.invalidateQueries({ queryKey: ["tool-history", SLUG] });
      } else {
        toast.error("Nie udało się zapisać");
      }
    },
    onError: () => toast.error("Nie udało się zapisać"),
  });

  return (
    <CalculatorShell
      title="Kalkulator potencjału przychodu"
      subtitle="Zobacz, ile możesz zarabiać miesięcznie i rocznie przy obecnej cenie, ruchu i konwersji."
      icon={<TrendingUp className="w-6 h-6" />}
      form={
        <div className="space-y-4">
          <Field label="Cena produktu (zł)" value={price} onChange={setPrice} min={1} step={10} />
          <Field
            label="Ruch miesięczny (osoby na ofertę)"
            value={traffic}
            onChange={setTraffic}
            min={1}
            step={100}
          />
          <Field label="Konwersja (%)" value={cr} onChange={setCr} min={0.1} step={0.1} />
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="w-full bg-gradient-violet text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {mut.isPending ? "Zapisywanie…" : "Zapisz wynik (+10 XP)"}
          </Button>
        </div>
      }
      result={
        <div className="space-y-4">
          <Big label="Miesięczny przychód" value={fmtPLN(monthly)} accent="text-violet" />
          <Big label="Roczny przychód" value={fmtPLN(yearly)} accent="text-green" />
          <div className="overflow-hidden rounded-2xl border border-violet/15 bg-gradient-to-br from-violet-soft/70 via-background to-blue-soft/70 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Prognoza 12 mies.
                </div>
                <div className="mt-0.5 text-sm font-bold">Rozwój miesięcznego przychodu</div>
              </div>
              <span className="shrink-0 rounded-full border border-green/20 bg-green-soft px-2.5 py-1 text-[10px] font-extrabold text-green">
                +5% / mies.
              </span>
            </div>

            <ChartContainer config={chartConfig} className="h-[210px] w-full aspect-auto">
              <BarChart
                data={forecastData}
                margin={{ top: 12, right: 4, left: -16, bottom: 0 }}
                barCategoryGap="22%"
              >
                <defs>
                  <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--violet)" />
                    <stop offset="100%" stopColor="var(--blue)" />
                  </linearGradient>
                  <filter id="revenueBarGlow" x="-30%" y="-20%" width="160%" height="160%">
                    <feDropShadow
                      dx="0"
                      dy="5"
                      stdDeviation="5"
                      floodColor="var(--violet)"
                      floodOpacity="0.18"
                    />
                  </filter>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 5" opacity={0.55} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `M${value}`}
                  fontSize={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                  width={48}
                  fontSize={10}
                  tickFormatter={formatCompactPLN}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--violet-soft)", opacity: 0.45, radius: 8 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => `Miesiąc ${label}`}
                      formatter={(value) => (
                        <div className="flex min-w-[130px] items-center justify-between gap-4">
                          <span className="text-muted-foreground">Przychód</span>
                          <span className="font-display font-extrabold text-violet">
                            {fmtPLN(Number(value))}
                          </span>
                        </div>
                      )}
                      hideIndicator
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#revenueBarGradient)"
                  radius={[9, 9, 3, 3]}
                  minPointSize={4}
                  maxBarSize={38}
                  style={{ filter: "url(#revenueBarGlow)" }}
                />
              </BarChart>
            </ChartContainer>

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
              <ForecastStat label="Start" value={fmtPLN(breakdown[0] ?? 0)} />
              <ForecastStat
                label="Miesiąc 12"
                value={fmtPLN(breakdown[breakdown.length - 1] ?? 0)}
                accent
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Sprzedaży/mies: <strong>{fmtNum((traffic * cr) / 100)}</strong> · Sprzedaży/rok:{" "}
            <strong>{fmtNum(((traffic * cr) / 100) * 12)}</strong>
          </p>
        </div>
      }
      history={
        <ul className="text-sm divide-y divide-border">
          {(hist?.rows ?? []).map((r) => {
            const o = r.outputs as { monthly?: number; yearly?: number };
            return (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">
                  {new Date(r.created_at).toLocaleString("pl-PL")}
                </span>
                <span className="font-bold">{fmtPLN(o.monthly ?? 0)} / mies.</span>
              </li>
            );
          })}
          {(hist?.rows ?? []).length === 0 && (
            <li className="py-2 text-xs text-muted-foreground">Brak zapisanych wyników.</li>
          )}
        </ul>
      }
    />
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1"
      />
    </div>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-4">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </div>
      <div className={`font-display font-extrabold text-3xl mt-1 ${accent}`}>{value}</div>
    </div>
  );
}

function ForecastStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/75 px-3 py-2">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 font-display text-sm font-extrabold ${
          accent ? "text-violet" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function formatCompactPLN(value: number): string {
  if (!isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} mln`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toLocaleString("pl-PL", { maximumFractionDigits: 0 })} tys.`;
  }
  return value.toLocaleString("pl-PL");
}
