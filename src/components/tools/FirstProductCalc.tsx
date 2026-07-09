import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Rocket, Save, FileText, GraduationCap, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { CalculatorShell, fmtPLN } from "./CalculatorShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getToolHistory, saveToolResult } from "@/lib/tools.functions";

const SLUG = "first-product";

type ProductKey = "ebook" | "kurs" | "other";
const PRODUCTS: Record<
  ProductKey,
  { label: string; price: number | null; defaultQty: number; icon: typeof FileText }
> = {
  ebook: { label: "Ebook", price: 97, defaultQty: 100, icon: FileText },
  kurs: { label: "Kurs", price: 1490, defaultQty: 10, icon: GraduationCap },
  other: { label: "Inny produkt", price: null, defaultQty: 100, icon: PackagePlus },
};

export function FirstProductCalc() {
  const [product, setProduct] = useState<ProductKey>("kurs");
  const [qty, setQty] = useState(10);
  const [customPrice, setCustomPrice] = useState(0);

  const price = PRODUCTS[product].price ?? customPrice;
  const revenue = useMemo(() => price * Math.max(0, qty), [price, qty]);

  const qc = useQueryClient();
  const save = useServerFn(saveToolResult);
  const history = useServerFn(getToolHistory);
  const { data: hist } = useQuery({
    queryKey: ["tool-history", SLUG],
    queryFn: () => history({ data: { tool_slug: SLUG, limit: 5 } }),
  });

  const mut = useMutation({
    mutationFn: () => {
      if (product === "other" && customPrice <= 0) {
        throw new Error("Podaj cenę swojego produktu");
      }
      return save({
        data: {
          tool_slug: SLUG,
          inputs: { product, productLabel: PRODUCTS[product].label, qty, price },
          outputs: { revenue },
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.xpAwarded > 0 ? `Zapisano! +${res.xpAwarded} XP 🔥` : "Zapisano wynik");
        qc.invalidateQueries({ queryKey: ["tool-history", SLUG] });
      } else {
        toast.error("Nie udało się zapisać");
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać"),
  });

  const selectProduct = (key: ProductKey) => {
    setProduct(key);
    setQty(PRODUCTS[key].defaultQty);
  };

  return (
    <CalculatorShell
      title="Sprzedaj swój pierwszy produkt"
      subtitle="Wybierz typ produktu i ilość — zobacz, ile zarobisz na pierwszej kampanii."
      icon={<Rocket className="w-6 h-6" />}
      form={
        <div className="space-y-5">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Produkt
            </Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(Object.keys(PRODUCTS) as ProductKey[]).map((k) => {
                const p = PRODUCTS[k];
                const Icon = p.icon;
                const active = product === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => selectProduct(k)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-violet bg-violet-soft shadow-glow"
                        : "border-border bg-card hover:border-violet/40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl grid place-items-center ${
                        active
                          ? "bg-gradient-violet text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-display font-extrabold mt-2">{p.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.price === null ? "Własna cena" : `${p.price} zł`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {product === "other" && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cena jednostkowa produktu
              </Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={customPrice || ""}
                  onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="Np. 249"
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  zł
                </span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ilość sprzedaży
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || (product === "other" && customPrice <= 0)}
            className="w-full bg-gradient-violet text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {mut.isPending ? "Zapisywanie…" : "Zapisz wynik (+10 XP)"}
          </Button>
        </div>
      }
      result={
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-violet-soft to-blue-soft border border-border p-5">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Szacunkowy przychód
            </div>
            <div className="font-display font-extrabold text-4xl mt-1 text-violet">
              {fmtPLN(revenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {qty} × {PRODUCTS[product].label} ({fmtPLN(price)})
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Mini label="Cena jednostkowa" value={fmtPLN(price)} />
            <Mini label="Sprzedanych sztuk" value={String(qty)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {product === "ebook"
              ? "Wskazówka: 100 sprzedaży ebooka to dobry, konkretny cel pierwszej kampanii."
              : product === "kurs"
                ? "Wskazówka: nawet 10 sprzedaży kursu może dać solidny budżet na rozwój kolejnego produktu."
                : "Wskazówka: zacznij od celu 100 sztuk, a potem dopasuj go do ceny i sposobu sprzedaży."}
          </p>
        </div>
      }
      history={
        <ul className="text-sm divide-y divide-border">
          {(hist?.rows ?? []).map((r) => {
            const o = r.outputs as { revenue?: number };
            const i = r.inputs as {
              product?: string;
              productLabel?: string;
              qty?: number;
              price?: number;
            };
            const productLabel =
              i.productLabel ??
              (i.product && i.product in PRODUCTS
                ? PRODUCTS[i.product as ProductKey].label
                : "Produkt");
            return (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs">
                  {new Date(r.created_at).toLocaleString("pl-PL")} · {i.qty} × {productLabel}
                  {typeof i.price === "number" ? ` po ${fmtPLN(i.price)}` : ""}
                </span>
                <span className="font-bold">{fmtPLN(o.revenue ?? 0)}</span>
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </div>
      <div className="font-display font-extrabold text-lg mt-0.5">{value}</div>
    </div>
  );
}
