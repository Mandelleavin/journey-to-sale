import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag, Save } from "lucide-react";
import { toast } from "sonner";
import { CalculatorShell, fmtPLN } from "./CalculatorShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getToolHistory, saveToolResult } from "@/lib/tools.functions";

const SLUG = "product-price";

export function ProductPriceCalc() {
  const [valueDelivered, setValueDelivered] = useState(5000);
  const [hoursSaved, setHoursSaved] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [competition, setCompetition] = useState(400);

  // Wartość ekonomiczna: oszczędność + bezpośrednia wartość
  const economic = useMemo(
    () => valueDelivered + hoursSaved * hourlyRate,
    [valueDelivered, hoursSaved, hourlyRate],
  );
  // Rekomendacja: 8-15% wartości ekonomicznej, kotwiczona do konkurencji
  const low = Math.max(Math.round(economic * 0.08), Math.round(competition * 0.7));
  const recommended = Math.max(Math.round(economic * 0.12), competition);
  const premium = Math.max(Math.round(economic * 0.18), Math.round(competition * 1.5));

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
          inputs: { valueDelivered, hoursSaved, hourlyRate, competition },
          outputs: { low, recommended, premium, economic },
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.xpAwarded > 0 ? `Zapisano! +${res.xpAwarded} XP 🔥` : "Zapisano");
        qc.invalidateQueries({ queryKey: ["tool-history", SLUG] });
      } else toast.error("Nie udało się zapisać");
    },
  });

  return (
    <CalculatorShell
      title="Kalkulator ceny produktu"
      subtitle="Ustal cenę opartą o wartość dla klienta — nie zgaduj. Podaj korzyści, oszczędność czasu i alternatywę."
      icon={<Tag className="w-6 h-6" />}
      form={
        <div className="space-y-4">
          <F label="Bezpośrednia wartość dla klienta (zł)" v={valueDelivered} on={setValueDelivered} step={100} />
          <F label="Ile godzin oszczędzasz klientowi" v={hoursSaved} on={setHoursSaved} step={1} />
          <F label="Stawka godzinowa klienta (zł)" v={hourlyRate} on={setHourlyRate} step={10} />
          <F label="Cena u konkurencji (zł)" v={competition} on={setCompetition} step={50} />
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
        <div className="space-y-3">
          <Card label="Wartość ekonomiczna" value={fmtPLN(economic)} sub="suma korzyści + oszczędności" />
          <Tier label="Cena wejściowa" value={fmtPLN(low)} desc="Dla testów rynku, MVP" tone="blue" />
          <Tier label="Cena rekomendowana" value={fmtPLN(recommended)} desc="Najlepszy balans wartość/cena" tone="violet" highlight />
          <Tier label="Cena premium" value={fmtPLN(premium)} desc="Dla pełnej oferty + bonusy + gwarancja" tone="orange" />
        </div>
      }
      history={
        <ul className="text-sm divide-y divide-border">
          {(hist?.rows ?? []).map((r) => {
            const o = r.outputs as { recommended?: number };
            return (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">
                  {new Date(r.created_at).toLocaleString("pl-PL")}
                </span>
                <span className="font-bold">Rekom.: {fmtPLN(o.recommended ?? 0)}</span>
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

function F({ label, v, on, step }: { label: string; v: number; on: (n: number) => void; step?: number }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" min={0} step={step} value={v} onChange={(e) => on(Number(e.target.value) || 0)} className="mt-1" />
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-4">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
      <div className="font-display font-extrabold text-2xl mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Tier({
  label,
  value,
  desc,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  desc: string;
  tone: "blue" | "violet" | "orange";
  highlight?: boolean;
}) {
  const toneClass =
    tone === "blue" ? "text-blue" : tone === "orange" ? "text-orange" : "text-violet";
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-violet bg-violet-soft/30" : "border-border"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
        <div className={`font-display font-extrabold text-xl ${toneClass}`}>{value}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
