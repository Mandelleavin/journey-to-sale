import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateStripePromoCode } from "@/utils/promo-codes.functions";
import { getStripeEnvironment } from "@/lib/stripe";

type Result =
  | { ok: true; code: string; discountLabel: string; durationLabel: string; minAmount: number | null }
  | { ok: false; error: string };

type Props = {
  kind: "subscription" | "one_time";
  /** Kwota zamówienia w PLN (opcjonalna, do walidacji minimum) */
  orderAmount?: number;
  /** Wywoływane gdy kod zwalidowany pomyślnie — przekaż do checkoutu */
  onApplied?: (code: string) => void;
  /** Wywoływane gdy użytkownik usunie zaakceptowany kod */
  onCleared?: () => void;
  className?: string;
};

export function PromoCodeInput({
  kind,
  orderAmount,
  onApplied,
  onCleared,
  className,
}: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const env = getStripeEnvironment();

  const validate = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    if (!/^[A-Z0-9_-]{3,40}$/.test(trimmed)) {
      setResult({ ok: false, error: "Nieprawidłowy format kodu (3-40 znaków: A-Z, 0-9, _, -)" });
      return;
    }
    setBusy(true);
    try {
      const res = (await validateStripePromoCode({
        data: { code: trimmed, environment: env, kind, orderAmount },
      })) as Result;
      setResult(res);
      if (res.ok) onApplied?.(res.code);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się sprawdzić kodu";
      setResult({ ok: false, error: msg });
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setCode("");
    setResult(null);
    onCleared?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!(result && result.ok) ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (result) setResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && validate()}
                placeholder="Kod rabatowy"
                className="pl-9 uppercase"
                maxLength={40}
                disabled={busy}
              />
            </div>
            <Button
              type="button"
              onClick={validate}
              disabled={busy || !code.trim()}
              variant="outline"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sprawdź"}
            </Button>
          </div>
          {result && !result.ok && (
            <div className="flex items-center gap-2 text-xs text-destructive font-medium">
              <X className="w-3.5 h-3.5" />
              {result.error}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green/40 bg-green-soft/40 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="w-4 h-4 text-green shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">
                Kod {result.code} aktywny: {result.discountLabel}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {result.durationLabel}
                {result.minAmount && ` · min. ${result.minAmount.toFixed(2)} PLN`}
              </div>
            </div>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            Usuń
          </Button>
        </div>
      )}
    </div>
  );
}
