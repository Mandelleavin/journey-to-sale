import { Link } from "@tanstack/react-router";
import { Lock, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LABEL, type Plan } from "@/lib/plan-gating";

interface Props {
  featureLabel?: string | null;
  currentPlan: Plan;
  requiredPlan: Plan | null;
  compact?: boolean;
}

export function UpgradeScreen({ featureLabel, currentPlan, requiredPlan, compact }: Props) {
  const target = requiredPlan ?? "pro";
  const isCourseAccess = featureLabel?.toLowerCase().includes("kurs");
  const title = isCourseAccess
    ? "Odblokuj kolejne kursy"
    : featureLabel
      ? `Odblokuj: ${featureLabel}`
      : "Ta funkcja jest zablokowana";
  const description = isCourseAccess
    ? "Ten etap programu jest dostępny w wyższym planie. Po zmianie pakietu otrzymasz dostęp do kolejnych lekcji, zadań i materiałów."
    : "Ta funkcja jest częścią wyższego planu. Zmień pakiet, aby korzystać z niej bez ograniczeń.";

  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-violet/20 bg-gradient-to-br from-violet-soft/50 via-background to-blue-soft/40 p-6 text-center shadow-soft"
          : "min-h-[60vh] flex items-center justify-center p-6"
      }
    >
      <div
        className={
          compact
            ? ""
            : "relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-violet/20 bg-gradient-to-br from-violet-soft/55 via-background to-blue-soft/45 p-8 text-center shadow-soft"
        }
      >
        <div className="pointer-events-none absolute -right-16 -top-16 hidden h-40 w-40 rounded-full bg-violet/10 blur-3xl sm:block" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 hidden h-44 w-44 rounded-full bg-blue/10 blur-3xl sm:block" />

        <div className="relative mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-violet-soft shadow-glow ring-8 ring-violet-soft/45">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-violet text-white shadow-soft">
            <Lock className="h-7 w-7" />
          </div>
        </div>
        <div className="relative">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet">
            Dostęp premium
          </div>
          <h2 className="mx-auto max-w-xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Twój obecny plan
            </div>
            <div className="mt-1 font-display text-lg font-extrabold">
              {PLAN_LABEL[currentPlan]}
            </div>
          </div>
          <div className="rounded-2xl border border-violet/30 bg-violet-soft/70 px-4 py-3 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wide text-violet">
              Potrzebny do odblokowania
            </div>
            <div className="mt-1 font-display text-lg font-extrabold text-violet">
              {PLAN_LABEL[target]}
            </div>
          </div>
        </div>

        <div className="relative my-6 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          {(["start", "pro", "vip"] as Plan[]).map((p) => (
            <div
              key={p}
              className={`rounded-2xl border px-3 py-3 transition ${
                p === target
                  ? "border-violet bg-violet-soft font-extrabold text-violet shadow-soft"
                  : p === currentPlan
                    ? "border-foreground/20 bg-muted/50 font-bold"
                    : "border-border bg-background/65 text-muted-foreground"
              }`}
            >
              {p === "vip" && <Crown className="w-3 h-3 inline mr-1" />}
              {p === "pro" && <Sparkles className="w-3 h-3 inline mr-1" />}
              {PLAN_LABEL[p]}
            </div>
          ))}
        </div>

        <Button asChild className="relative h-12 w-full rounded-2xl bg-gradient-violet text-white shadow-glow hover:opacity-90">
          <Link to="/pricing">
            Zobacz plany i odblokuj dostęp
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
