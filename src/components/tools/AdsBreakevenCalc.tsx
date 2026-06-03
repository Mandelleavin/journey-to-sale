import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Save } from "lucide-react";
import { toast } from "sonner";
import { CalculatorShell, fmtPLN, fmtNum } from "./CalculatorShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getToolHistory, saveToolResult } from "@/lib/tools.functions";

const SLUG = "ads-breakeven";

export function AdsBreakevenCalc() {
  const [price, setPrice] = useState(297);
  const [margin, setMargin] = useState(80);
  const [cpc, setCpc] = useState(1.5);
  const [lpCr, setLpCr] = useState(3);

  const profitPerSale = useMemo(() => (price * margin) / 100, [price, margin]);
  const maxCpa = profitPerSale; // breakeven
  const targetCpa = profitPerSale / 2; // 2× ROAS na zysku
  const clicksPerSale = lpCr > 0 ? 100 / lpCr : 0;
  const cpaEstimate = clicksPerSale * cpc;
  const roas = cpaEstimate > 0 ? price / cpaEstimate : 0;
  const profitable = cpaEstimate < profitPerSale;

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
          inputs: { price, margin, cpc, lpCr },
          outputs: { profitPerSale, maxCpa, targetCpa, cpaEstimate, roas, profitable },
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
      title="Kalkulator break-even reklam"
      subtitle="Sprawdź czy Twoja kampania wyjdzie na plus — ile możesz wydać za klienta i jaki ROAS osiągniesz."
      icon={<Megaphone className="w-6 h-6" />}
      form={
        <div className="space-y-4">
          <F label="Cena produktu (zł)" v={price} on={setPrice} step={10} />
          <F label="Marża (%)" v={margin} on={setMargin} step={1} max={100} />
          <F label="Koszt kliknięcia CPC (zł)" v={cpc} on={setCpc} step={0.1} />
          <F label="Konwersja landing page (%)" v={lpCr} on={setLpCr} step={0.1} />
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
          <div
            className={`rounded-2xl border-2 p-4 ${
              profitable ? "border-green bg-green/10" : "border-orange bg-orange/10"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold">
              {profitable ? "✅ Rentowne" : "⚠️ Pod kreską"}
            </div>
            <div className="font-display font-extrabold text-2xl mt-1">
              ROAS: {fmtNum(roas)}×
            </div>
            <div className="text-xs text-muted-foreground">
              Koszt klienta (CPA): <strong>{fmtPLN(cpaEstimate)}</strong> / Zysk:{" "}
              <strong>{fmtPLN(profitPerSale)}</strong>
            </div>
          </div>
          <Card label="Max CPA (break-even)" value={fmtPLN(maxCpa)} />
          <Card label="Cel CPA (zdrowy zysk)" value={fmtPLN(targetCpa)} />
          <Card label="Potrzeba kliknięć na sprzedaż" value={fmtNum(clicksPerSale)} />
        </div>
      }
      history={
        <ul className="text-sm divide-y divide-border">
          {(hist?.rows ?? []).map((r) => {
            const o = r.outputs as { roas?: number; profitable?: boolean };
            return (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">
                  {new Date(r.created_at).toLocaleString("pl-PL")}
                </span>
                <span className={`font-bold ${o.profitable ? "text-green" : "text-orange"}`}>
                  ROAS {fmtNum(o.roas ?? 0)}×
                </span>
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

function F({ label, v, on, step, max }: { label: string; v: number; on: (n: number) => void; step?: number; max?: number }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" min={0} max={max} step={step} value={v} onChange={(e) => on(Number(e.target.value) || 0)} className="mt-1" />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-3 flex items-baseline justify-between">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display font-extrabold text-lg">{value}</div>
    </div>
  );
}
