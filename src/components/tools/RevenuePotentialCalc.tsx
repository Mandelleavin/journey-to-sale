import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Save } from "lucide-react";
import { toast } from "sonner";
import { CalculatorShell, fmtPLN, fmtNum } from "./CalculatorShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getToolHistory, saveToolResult } from "@/lib/tools.functions";

const SLUG = "revenue-potential";

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
        toast.success(
          res.xpAwarded > 0 ? `Zapisano! +${res.xpAwarded} XP 🔥` : "Zapisano wynik",
        );
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
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
              Prognoza 12 mies. (przy 5% wzroście / mies.)
            </div>
            <div className="flex items-end gap-1 h-24">
              {breakdown.map((v, i) => {
                const max = Math.max(...breakdown);
                const h = max > 0 ? (v / max) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-violet rounded-t-md min-h-[4px]"
                    style={{ height: `${h}%` }}
                    title={fmtPLN(v)}
                  />
                );
              })}
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
