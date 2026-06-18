import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/dashboard/PageShell";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STARTER_PRODUCT_FIELD_KEYS } from "@/lib/business-plan-starter-fields";
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  CircleHelp,
  Lightbulb,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPlanStructure,
  getMyPlanState,
  verifyPlanAccess,
  savePlanResponse,
  type PlanSection,
  type PlanField,
  type PlanResponse,
  type PlanResponseValue,
} from "@/lib/business-plan.functions";

export const Route = createFileRoute("/plan-12-tygodni")({
  loader: () => getPlanStructure(),
  head: () => ({
    meta: [
      { title: "Wystartuj Biznes w 12 Tygodni — Interaktywny Plan | 90 Dni" },
      {
        name: "description",
        content:
          "Interaktywny plan działania na 12 tygodni: pomysł, marka, oferta, webinar, sprzedaż. Wypełnij online i zsynchronizuj z kursem.",
      },
      { property: "og:title", content: "Wystartuj Biznes w 12 Tygodni — Interaktywny Plan" },
      {
        property: "og:description",
        content:
          "11 etapów rozwoju biznesu online. Wypełniasz w kursie — plan aktualizuje się automatycznie.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://journey-to-sale.lovable.app/plan-12-tygodni" }],
  }),
  errorComponent: () => (
    <PageShell title="Plan 12 tygodni" subtitle="Wystąpił błąd podczas ładowania.">
      <p className="text-sm text-muted-foreground">Spróbuj odświeżyć stronę.</p>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell title="Nie znaleziono" subtitle="">
      <Link to="/" className="text-violet font-semibold">
        ← Wróć
      </Link>
    </PageShell>
  ),
  component: PlanPage,
});

function PlanPage() {
  const { sections } = Route.useLoaderData() as { sections: PlanSection[] };
  const { user, loading: authLoading } = useAuth();
  const getState = useServerFn(getMyPlanState);
  const [state, setState] = useState<{ hasAccess: boolean; responses: PlanResponse[] } | null>(
    null,
  );
  const [loadingState, setLoadingState] = useState(true);
  const [localAccess, setLocalAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoadingState(false);
      setLocalAccess(false);
      return;
    }
    setLocalAccess(
      typeof window !== "undefined" &&
        window.localStorage.getItem(`business-plan-access:${user.id}`) === "true",
    );
    getState()
      .then((s) => setState(s))
      .finally(() => setLoadingState(false));
  }, [user, getState]);

  if (authLoading || (user && loadingState)) {
    return (
      <PageShell title="Plan 12 tygodni" subtitle="">
        <div className="py-20 text-center text-muted-foreground">Ładowanie…</div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell
        title="Wystartuj Biznes w 12 Tygodni"
        subtitle="Interaktywny plan, który wypełniasz krok po kroku — i który łączy się z kursem."
      >
        <SignInCta />
      </PageShell>
    );
  }

  if (!state?.hasAccess && !localAccess) {
    return (
      <PageShell
        title="Wystartuj Biznes w 12 Tygodni"
        subtitle="Wprowadź hasło z webinaru lub kod VIP, aby odblokować plan."
      >
        <AccessGate
          onUnlocked={() => {
            window.localStorage.setItem(`business-plan-access:${user.id}`, "true");
            setLocalAccess(true);
          }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Wystartuj Biznes w 12 Tygodni"
      subtitle="Twój interaktywny plan działania. Zmiany zapisują się automatycznie."
    >
      <PlanEditor
        sections={sections}
        responses={state?.responses ?? []}
        onSaved={() => getState().then((s) => setState(s))}
      />
    </PageShell>
  );
}

function SignInCta() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border-2 border-violet/30 bg-gradient-to-br from-violet-soft/40 to-blue-soft/20 p-8 text-center">
      <Lock className="w-10 h-10 mx-auto text-violet mb-3" />
      <h2 className="font-display text-2xl font-extrabold mb-2">
        Zaloguj się, aby odblokować plan
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Plan wymaga konta — Twoje odpowiedzi zapisują się i synchronizują z kursem.
      </p>
      <Link to="/auth">
        <Button className="rounded-xl bg-gradient-violet">Zaloguj się / Załóż konto</Button>
      </Link>
    </div>
  );
}

function AccessGate({ onUnlocked }: { onUnlocked: () => void }) {
  const verify = useServerFn(verifyPlanAccess);
  const [tab, setTab] = useState<"password" | "code">("password");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!value.trim()) return;
    setBusy(true);
    try {
      const res = await verify({
        data: tab === "password" ? { password: value } : { code: value },
      });
      if (res.ok) {
        toast.success("Plan odblokowany!");
        onUnlocked();
      } else {
        toast.error(res.error ?? "Błąd weryfikacji");
      }
    } catch (error) {
      console.error("Plan access verification failed", error);
      toast.error("Nie udało się sprawdzić hasła.", {
        description: "Odśwież stronę i spróbuj ponownie.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border-2 border-violet/30 bg-card p-6 md:p-8 shadow-soft">
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("password")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
            tab === "password" ? "bg-gradient-violet text-primary-foreground" : "bg-muted"
          }`}
        >
          Hasło z webinaru
        </button>
        <button
          onClick={() => setTab("code")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
            tab === "code" ? "bg-gradient-violet text-primary-foreground" : "bg-muted"
          }`}
        >
          Kod VIP
        </button>
      </div>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {tab === "password" ? "Hasło" : "Kod jednorazowy"}
      </Label>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={tab === "password" ? "Podane na webinarze" : "ABC12345"}
        className="mt-1 mb-4 h-12 text-lg"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <Button
        onClick={submit}
        disabled={busy || !value.trim()}
        className="w-full h-12 rounded-xl bg-gradient-violet text-primary-foreground font-bold"
      >
        {busy ? "Sprawdzam…" : "Odblokuj plan"}
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-4">
        Po odblokowaniu plan zostaje przypisany do Twojego konta na stałe.
      </p>
    </div>
  );
}

function PlanEditor({
  sections,
  responses,
  onSaved,
}: {
  sections: PlanSection[];
  responses: PlanResponse[];
  onSaved: () => void;
}) {
  const responsesMap = useMemo(() => {
    const m = new Map<string, PlanResponse>();
    for (const r of responses) m.set(r.field_key, r);
    return m;
  }, [responses]);

  const [activeSection, setActiveSection] = useState(sections[0]?.key ?? "");

  const totalFields = sections.reduce((s, sec) => s + sec.fields.length, 0);
  const filledFields = sections.reduce(
    (s, sec) =>
      s +
      sec.fields.filter((f) => {
        const v = responsesMap.get(f.field_key)?.value;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "string") return v.trim().length > 0;
        return v !== null && v !== undefined;
      }).length,
    0,
  );
  const pct = totalFields ? Math.round((filledFields / totalFields) * 100) : 0;

  const current = sections.find((s) => s.key === activeSection) ?? sections[0];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-display font-extrabold text-lg">Twój postęp</div>
            <div className="text-xs text-muted-foreground">
              {filledFields} z {totalFields} pól wypełnionych
            </div>
          </div>
          <div className="text-2xl font-display font-extrabold text-violet">{pct}%</div>
        </div>
        <Progress value={pct} className="h-3" />
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Section nav */}
        <aside className="lg:sticky lg:top-6 self-start space-y-1">
          {sections.map((s) => {
            const sectionFilled = s.fields.filter((f) => {
              const v = responsesMap.get(f.field_key)?.value;
              if (Array.isArray(v)) return v.length > 0;
              return v !== null && v !== undefined && String(v).trim() !== "";
            }).length;
            const active = s.key === current?.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full text-left px-4 py-3 rounded-xl transition border ${
                  active
                    ? "bg-gradient-violet text-primary-foreground border-transparent shadow-glow"
                    : "bg-card border-border hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.emoji ?? "📌"}</span>
                  <span className="text-sm font-bold flex-1">{s.title}</span>
                </div>
                <div
                  className={`text-xs mt-1 ${active ? "text-white/80" : "text-muted-foreground"}`}
                >
                  {sectionFilled} / {s.fields.length}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Section content */}
        <div className="space-y-5">
          {current && (
            <>
              <div className="rounded-3xl border-2 border-violet/30 bg-gradient-to-br from-violet-soft/30 to-transparent p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{current.emoji ?? "📌"}</span>
                  <div>
                    <h2 className="font-display text-2xl font-extrabold">{current.title}</h2>
                    {current.description && (
                      <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {current.key === sections[0]?.key ? (
                <StarterActionPlanFields
                  fields={current.fields}
                  responsesMap={responsesMap}
                  onSaved={onSaved}
                />
              ) : (
                current.fields.map((field) => (
                  <FieldRow
                    key={field.field_key}
                    field={field}
                    response={responsesMap.get(field.field_key) ?? null}
                    onSaved={onSaved}
                  />
                ))
              )}

              {/* Navigation between sections */}
              <div className="flex justify-between pt-4">
                {(() => {
                  const idx = sections.findIndex((s) => s.key === current.key);
                  const prev = idx > 0 ? sections[idx - 1] : null;
                  const next = idx < sections.length - 1 ? sections[idx + 1] : null;
                  return (
                    <>
                      {prev ? (
                        <Button variant="outline" onClick={() => setActiveSection(prev.key)}>
                          ← {prev.title}
                        </Button>
                      ) : (
                        <span />
                      )}
                      {next ? (
                        <Button
                          onClick={() => setActiveSection(next.key)}
                          className="bg-gradient-violet"
                        >
                          {next.title} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Link to="/courses">
                          <Button className="bg-gradient-violet">
                            <BookOpen className="w-4 h-4 mr-1" /> Przejdź do kursu
                          </Button>
                        </Link>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function isFilledPlanValue(value: PlanResponseValue | undefined) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

function StarterActionPlanFields({
  fields,
  responsesMap,
  onSaved,
}: {
  fields: PlanField[];
  responsesMap: Map<string, PlanResponse>;
  onSaved: () => void;
}) {
  const foundationFields = fields.filter(
    (field) => !STARTER_PRODUCT_FIELD_KEYS.has(field.field_key),
  );
  const productFields = fields.filter((field) => STARTER_PRODUCT_FIELD_KEYS.has(field.field_key));
  const foundationFilled = foundationFields.filter((field) =>
    isFilledPlanValue(responsesMap.get(field.field_key)?.value),
  ).length;
  const productFilled = productFields.filter((field) =>
    isFilledPlanValue(responsesMap.get(field.field_key)?.value),
  ).length;
  const [activePart, setActivePart] = useState<"foundation" | "product">("foundation");
  const activePartConfig =
    activePart === "foundation"
      ? {
          eyebrow: "Część 1",
          title: "Fundament, predyspozycje i pierwsze pomysły",
          description:
            "Tu zbierasz podstawowe informacje o sobie, zasobach, celu i rytmie pracy. To pomaga później ocenić, jaki typ produktu ma dla Ciebie sens.",
          icon: <Lightbulb className="h-5 w-5" />,
          filled: foundationFilled,
          total: foundationFields.length,
          fields: foundationFields,
        }
      : {
          eyebrow: "Część 2",
          title: "Plan działania: konkretny produkt",
          description:
            "Tu składasz roboczą ofertę: nazwę, obietnicę, pakiety, grupę docelową, transformację i główne CTA.",
          icon: <Sparkles className="h-5 w-5" />,
          filled: productFilled,
          total: productFields.length,
          fields: productFields,
        };
  const readyForAnalysis =
    foundationFields.length > 0 &&
    productFields.length > 0 &&
    foundationFilled === foundationFields.length &&
    productFilled === productFields.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-2">
        <StarterPartSelector
          active={activePart === "foundation"}
          eyebrow="Część 1"
          title="Fundament i pomysły"
          description="Predyspozycje, zasoby, cel i rytm pracy."
          icon={<Lightbulb className="h-5 w-5" />}
          filled={foundationFilled}
          total={foundationFields.length}
          tone="foundation"
          onClick={() => setActivePart("foundation")}
        />
        <StarterPartSelector
          active={activePart === "product"}
          eyebrow="Część 2"
          title="Konkretny produkt"
          description="Nazwa, oferta, pakiety, grupa docelowa i CTA."
          icon={<Sparkles className="h-5 w-5" />}
          filled={productFilled}
          total={productFields.length}
          tone="product"
          onClick={() => setActivePart("product")}
        />
      </div>

      <StarterFieldGroup
        eyebrow={activePartConfig.eyebrow}
        title={activePartConfig.title}
        description={activePartConfig.description}
        icon={activePartConfig.icon}
        filled={activePartConfig.filled}
        total={activePartConfig.total}
      >
        {activePartConfig.fields.map((field) => (
          <FieldRow
            key={field.field_key}
            field={field}
            response={responsesMap.get(field.field_key) ?? null}
            onSaved={onSaved}
          />
        ))}
      </StarterFieldGroup>

      <div className="rounded-3xl border border-violet/25 bg-gradient-to-br from-violet-soft/70 via-card to-blue-soft/40 p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-violet text-primary-foreground shadow-glow">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide text-violet">
                Następny krok
              </div>
              <h3 className="font-display text-xl font-extrabold">Analiza AI Twojego pomysłu</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Po uzupełnieniu obu części AI będzie mogło ocenić spójność pomysłu, wskazać braki i
                ułożyć kolejne kroki działania zgodnie z etapami lekcji.
              </p>
            </div>
          </div>
          <Badge
            className={
              readyForAnalysis
                ? "border-0 bg-green-soft text-green"
                : "border-0 bg-violet-soft text-violet"
            }
          >
            {readyForAnalysis ? "Gotowe do analizy" : "Uzupełnij obie części"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function StarterPartSelector({
  active,
  eyebrow,
  title,
  description,
  icon,
  filled,
  total,
  tone,
  onClick,
}: {
  active: boolean;
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  filled: number;
  total: number;
  tone: "foundation" | "product";
  onClick: () => void;
}) {
  const pct = total ? Math.round((filled / total) * 100) : 0;
  const complete = total > 0 && filled === total;
  const isProduct = tone === "product";
  const toneClasses = isProduct
    ? {
        active:
          "border-orange/45 bg-gradient-to-br from-orange-soft/70 via-card to-violet-soft/45 ring-2 ring-orange/15",
        inactive:
          "border-orange/20 bg-gradient-to-br from-orange-soft/25 via-card to-white hover:-translate-y-0.5 hover:border-orange/35 hover:bg-orange-soft/35",
        iconActive: "bg-gradient-orange text-primary-foreground shadow-soft",
        iconIdle: "bg-orange-soft text-orange",
        text: "text-orange",
        badge: complete ? "bg-green-soft text-green" : "bg-orange-soft text-orange",
        cta: "Uzupełnij ofertę",
      }
    : {
        active:
          "border-violet/45 bg-gradient-to-br from-violet-soft/80 via-card to-blue-soft/45 ring-2 ring-violet/15",
        inactive:
          "border-border bg-card/75 hover:-translate-y-0.5 hover:border-violet/25 hover:bg-violet-soft/30",
        iconActive: "bg-gradient-violet text-primary-foreground shadow-glow",
        iconIdle: "bg-violet-soft text-violet",
        text: "text-violet",
        badge: complete ? "bg-green-soft text-green" : "bg-violet-soft text-violet",
        cta: "Uzupełnij fundament",
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl border p-4 text-left shadow-soft transition-all ${
        active ? toneClasses.active : toneClasses.inactive
      }`}
    >
      <Badge
        className={`absolute right-4 top-4 border-0 px-2.5 py-1 text-[11px] font-extrabold ${
          toneClasses.badge
        }`}
      >
        {complete ? "Uzupełnione" : "Wymagane"}
      </Badge>
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            active ? toneClasses.iconActive : toneClasses.iconIdle
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 pr-28">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-extrabold uppercase tracking-wide ${toneClasses.text}`}>
              {eyebrow}
            </span>
            <Badge className={`border-0 px-2.5 py-1 text-xs font-extrabold ${toneClasses.badge}`}>
              {filled}/{total}
            </Badge>
          </div>
          <div className="mt-1 font-display text-lg font-extrabold">{title}</div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          <div className={`mt-3 text-xs font-bold ${complete ? "text-green" : toneClasses.text}`}>
            {complete ? "Ta część jest gotowa" : toneClasses.cta}
          </div>
        </div>
      </div>
      <Progress value={pct} className="mt-4 h-2" />
    </button>
  );
}

function StarterFieldGroup({
  eyebrow,
  title,
  description,
  icon,
  filled,
  total,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  filled: number;
  total: number;
  children: ReactNode;
}) {
  const pct = total ? Math.round((filled / total) * 100) : 0;

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-4 shadow-soft sm:p-5">
      <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-soft text-violet">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wide text-violet">
                {eyebrow}
              </div>
              <Badge className="border-0 bg-violet-soft px-2.5 py-1 text-xs font-extrabold text-violet">
                {filled}/{total} uzupełnione
              </Badge>
            </div>
            <h3 className="mt-1 font-display text-xl font-extrabold">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldRow({
  field,
  response,
  onSaved,
}: {
  field: PlanField;
  response: PlanResponse | null;
  onSaved: () => void;
}) {
  const save = useServerFn(savePlanResponse);
  const [value, setValue] = useState<PlanResponseValue>(
    (response?.value as PlanResponseValue) ?? (field.input_type === "checkbox_group" ? [] : ""),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(response?.updated_at ?? null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setValue(
      (response?.value as PlanResponseValue) ?? (field.input_type === "checkbox_group" ? [] : ""),
    );
    setSavedAt(response?.updated_at ?? null);
  }, [response, field.input_type]);

  const commit = async (v: PlanResponseValue) => {
    setSaving(true);
    try {
      await save({ data: { field_key: field.field_key, value: v } });
      setSavedAt(new Date().toISOString());
      onSaved();
    } catch (e) {
      toast.error("Nie udało się zapisać");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onChangeText = (v: string) => {
    setValue(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => commit(v), 700);
  };

  const fromLesson = response?.source === "lesson";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-bold">{field.label}</Label>
            {field.help_text && (
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet/20 bg-violet-soft text-violet transition hover:border-violet/40"
                      aria-label={`Podpowiedź: ${field.label}`}
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs rounded-xl bg-ink px-3 py-2 text-left text-xs leading-relaxed text-white"
                  >
                    {field.help_text}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {field.help_text && (
            <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {fromLesson && (
            <Badge className="bg-blue-soft text-blue border-0 text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" /> z lekcji
            </Badge>
          )}
          {saving && <span className="text-[10px] text-muted-foreground">zapis…</span>}
          {!saving && savedAt && (
            <span className="text-[10px] text-green inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> zapisano
            </span>
          )}
        </div>
      </div>

      {field.input_type === "text" || field.input_type === "url" ? (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={field.placeholder ?? ""}
          type={field.input_type === "url" ? "url" : "text"}
        />
      ) : field.input_type === "textarea" || field.input_type === "url_list" ? (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={field.placeholder ?? ""}
          className="min-h-[100px]"
        />
      ) : field.input_type === "single_choice" ? (
        <RadioGroup
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => {
            setValue(v);
            commit(v);
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2"
        >
          {field.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 rounded-xl border border-border p-3 cursor-pointer hover:bg-accent"
            >
              <RadioGroupItem value={opt.value} />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      ) : field.input_type === "checkbox_group" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {field.options.map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-xl border border-border p-3 cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c ? [...arr, opt.value] : arr.filter((x) => x !== opt.value);
                    setValue(next);
                    commit(next);
                  }}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {field.placeholder && (
        <div className="mt-3 rounded-xl border border-dashed border-violet/20 bg-violet-soft/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-bold text-violet">Przykład: </span>
          {field.placeholder}
        </div>
      )}
    </div>
  );
}
