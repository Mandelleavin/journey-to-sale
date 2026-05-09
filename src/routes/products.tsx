import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckSquare,
  ListChecks,
  PencilLine,
  Lock,
  Sparkles,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PRODUCT_MODULES,
  COLOR_CLASSES,
  totalItemsInModule,
  type BuilderModule,
} from "@/lib/product-builder-data";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Mój produkt — kreator 7 modułów" },
      {
        name: "description",
        content: "Buduj swój produkt krok po kroku. 7 modułów: od pomysłu do skalowania.",
      },
    ],
  }),
  component: ProductsPage,
});

type ProgressRow = {
  module_key: string;
  item_type: string;
  item_key: string;
  status: string;
  notes: string | null;
};

function ProductsPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string>(PRODUCT_MODULES[0].key);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("product_builder_progress")
      .select("module_key, item_type, item_key, status, notes")
      .eq("user_id", user.id);
    setProgress((data ?? []) as ProgressRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const doneSet = useMemo(() => {
    const s = new Set<string>();
    progress.forEach((p) => {
      if (p.status === "done") s.add(`${p.module_key}|${p.item_type}|${p.item_key}`);
    });
    return s;
  }, [progress]);

  const notesMap = useMemo(() => {
    const m = new Map<string, string>();
    progress.forEach((p) => {
      if (p.notes) m.set(`${p.module_key}|${p.item_type}|${p.item_key}`, p.notes);
    });
    return m;
  }, [progress]);

  const moduleStats = useMemo(() => {
    return PRODUCT_MODULES.map((mod) => {
      const total = totalItemsInModule(mod);
      let done = 0;
      (["lessons", "tasks", "checklist", "workbook"] as const).forEach((t) => {
        const itype = t === "lessons" ? "lesson" : t === "tasks" ? "task" : t === "checklist" ? "check" : "workbook";
        mod[t].forEach((it) => {
          if (doneSet.has(`${mod.key}|${itype}|${it.key}`)) done++;
        });
      });
      return { mod, total, done, pct: total ? Math.round((done / total) * 100) : 0 };
    });
  }, [doneSet]);

  const overall = useMemo(() => {
    const total = moduleStats.reduce((a, m) => a + m.total, 0);
    const done = moduleStats.reduce((a, m) => a + m.done, 0);
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [moduleStats]);

  const toggle = async (
    mod: BuilderModule,
    itype: "lesson" | "task" | "check" | "workbook",
    itemKey: string,
  ) => {
    if (!user) return;
    const k = `${mod.key}|${itype}|${itemKey}`;
    const isDone = doneSet.has(k);
    if (isDone) {
      const { error } = await supabase
        .from("product_builder_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("module_key", mod.key)
        .eq("item_type", itype)
        .eq("item_key", itemKey);
      if (error) return toast.error(error.message);
      setProgress((p) =>
        p.filter(
          (r) => !(r.module_key === mod.key && r.item_type === itype && r.item_key === itemKey),
        ),
      );
    } else {
      const { error } = await supabase.from("product_builder_progress").upsert(
        {
          user_id: user.id,
          module_key: mod.key,
          item_type: itype,
          item_key: itemKey,
          status: "done",
        },
        { onConflict: "user_id,module_key,item_type,item_key" },
      );
      if (error) return toast.error(error.message);
      load();
    }
  };

  const saveNote = async (
    mod: BuilderModule,
    itype: "lesson" | "task" | "check" | "workbook",
    itemKey: string,
    notes: string,
  ) => {
    if (!user) return;
    const { error } = await supabase.from("product_builder_progress").upsert(
      {
        user_id: user.id,
        module_key: mod.key,
        item_type: itype,
        item_key: itemKey,
        status: doneSet.has(`${mod.key}|${itype}|${itemKey}`) ? "done" : "todo",
        notes,
      },
      { onConflict: "user_id,module_key,item_type,item_key" },
    );
    if (error) return toast.error(error.message);
    toast.success("Zapisano");
    load();
  };

  const active = PRODUCT_MODULES.find((m) => m.key === activeModule)!;
  const activeStat = moduleStats.find((s) => s.mod.key === activeModule)!;

  return (
    <PageShell
      title="Mój produkt — kreator"
      subtitle="Krok po kroku zbuduj swój produkt — od pomysłu po skalowanie."
    >
      {/* OVERALL */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-bold uppercase">
                Ogólny postęp budowy
              </div>
              <div className="font-display font-extrabold text-3xl">
                {overall.done}
                <span className="text-muted-foreground text-xl">/{overall.total}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {overall.pct}% gotowe • 7 modułów
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange" />
            <span className="text-sm font-bold">
              {moduleStats.filter((m) => m.pct === 100).length} / 7 modułów ukończonych
            </span>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-card overflow-hidden">
          <div
            className="h-full bg-gradient-violet transition-all"
            style={{ width: `${overall.pct}%` }}
          />
        </div>
      </div>

      {/* MODULE GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {moduleStats.map(({ mod, done, total, pct }) => {
          const c = COLOR_CLASSES[mod.color];
          const isActive = mod.key === activeModule;
          return (
            <button
              key={mod.key}
              onClick={() => setActiveModule(mod.key)}
              className={cn(
                "text-left rounded-2xl border p-4 transition-all hover:shadow-card",
                isActive
                  ? `${c.bg} border-transparent ring-2 ${c.ring}`
                  : "bg-card border-border hover:border-violet/30",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{mod.emoji}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                    c.bg,
                    c.text,
                  )}
                >
                  Moduł {mod.num}
                </span>
              </div>
              <div className="mt-2 font-display font-bold text-sm leading-tight">{mod.title}</div>
              <div className="mt-3 text-[11px] font-semibold text-muted-foreground">
                {done}/{total} elementów
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r", c.gradient)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE MODULE DETAIL */}
      {loading ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Ładowanie...
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div
            className={cn(
              "p-5 bg-gradient-to-r text-white",
              COLOR_CLASSES[active.color].gradient,
            )}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{active.emoji}</span>
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-80 font-bold">
                    Moduł {active.num}
                  </div>
                  <h2 className="font-display font-extrabold text-2xl">{active.title}</h2>
                </div>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {activeStat.done}/{activeStat.total} • {activeStat.pct}%
              </Badge>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${activeStat.pct}%` }}
              />
            </div>
          </div>

          <div className="p-5 grid lg:grid-cols-2 gap-5">
            <SectionCard
              icon={BookOpen}
              title="Lekcje"
              tone="blue"
              items={active.lessons.map((it) => ({
                ...it,
                done: doneSet.has(`${active.key}|lesson|${it.key}`),
              }))}
              onToggle={(k) => toggle(active, "lesson", k)}
            />
            <SectionCard
              icon={CheckSquare}
              title="Zadania"
              tone="violet"
              items={active.tasks.map((it) => ({
                ...it,
                done: doneSet.has(`${active.key}|task|${it.key}`),
              }))}
              onToggle={(k) => toggle(active, "task", k)}
            />
            <SectionCard
              icon={ListChecks}
              title="Checklisty"
              tone="green"
              items={active.checklist.map((it) => ({
                ...it,
                done: doneSet.has(`${active.key}|check|${it.key}`),
              }))}
              onToggle={(k) => toggle(active, "check", k)}
            />
            <WorkbookCard
              moduleKey={active.key}
              items={active.workbook.map((it) => ({
                ...it,
                done: doneSet.has(`${active.key}|workbook|${it.key}`),
                notes: notesMap.get(`${active.key}|workbook|${it.key}`) ?? "",
              }))}
              onToggle={(k) => toggle(active, "workbook", k)}
              onSave={(k, n) => saveNote(active, "workbook", k, n)}
            />
          </div>

          {/* NEXT MODULE NAV */}
          {active.num < 7 && (
            <div className="p-5 border-t border-border flex justify-end">
              <Button
                onClick={() => setActiveModule(PRODUCT_MODULES[active.num].key)}
                className="bg-gradient-violet text-primary-foreground"
              >
                Przejdź do Moduł {active.num + 1}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function SectionCard({
  icon: Icon,
  title,
  tone,
  items,
  onToggle,
}: {
  icon: typeof BookOpen;
  title: string;
  tone: "blue" | "violet" | "green";
  items: { key: string; label: string; done: boolean }[];
  onToggle: (k: string) => void;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-blue-soft text-blue"
      : tone === "violet"
        ? "bg-violet-soft text-violet"
        : "bg-green/10 text-green";
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-8 h-8 rounded-lg grid place-items-center", toneCls)}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-display font-bold text-sm">{title}</h3>
        <span className="ml-auto text-[11px] text-muted-foreground font-semibold">
          {items.filter((i) => i.done).length}/{items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.key}>
            <button
              onClick={() => onToggle(it.key)}
              className={cn(
                "w-full flex items-start gap-2 p-2 rounded-lg text-left text-sm transition-colors hover:bg-muted/50",
                it.done && "text-muted-foreground line-through",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 mt-0.5 shrink-0 rounded border grid place-items-center transition-colors",
                  it.done ? "bg-green border-green text-white" : "border-muted-foreground/40",
                )}
              >
                {it.done && "✓"}
              </span>
              <span>{it.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkbookCard({
  moduleKey,
  items,
  onToggle,
  onSave,
}: {
  moduleKey: string;
  items: { key: string; label: string; done: boolean; notes: string }[];
  onToggle: (k: string) => void;
  onSave: (k: string, notes: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg grid place-items-center bg-orange-soft text-orange">
          <PencilLine className="w-4 h-4" />
        </div>
        <h3 className="font-display font-bold text-sm">Zeszyt ćwiczeń</h3>
        <span className="ml-auto text-[11px] text-muted-foreground font-semibold">
          {items.filter((i) => i.done).length}/{items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => {
          const isOpen = open === it.key;
          const value = drafts[it.key] ?? it.notes;
          return (
            <li key={it.key} className="rounded-lg border border-border bg-muted/20">
              <div className="flex items-center gap-2 p-2">
                <button
                  onClick={() => onToggle(it.key)}
                  className={cn(
                    "w-4 h-4 shrink-0 rounded border grid place-items-center",
                    it.done ? "bg-green border-green text-white" : "border-muted-foreground/40",
                  )}
                >
                  {it.done && "✓"}
                </button>
                <button
                  onClick={() => setOpen(isOpen ? null : it.key)}
                  className={cn(
                    "flex-1 text-left text-sm font-medium",
                    it.done && "line-through text-muted-foreground",
                  )}
                >
                  {it.label}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setOpen(isOpen ? null : it.key)}
                >
                  {isOpen ? "Zamknij" : it.notes ? "Edytuj" : "Otwórz"}
                </Button>
              </div>
              {isOpen && (
                <div className="px-2 pb-2 space-y-2">
                  <Textarea
                    value={value}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [it.key]: e.target.value }))
                    }
                    placeholder="Twoje notatki, odpowiedzi, pomysły..."
                    className="min-h-[100px] text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => onSave(it.key, value)}
                    className="bg-gradient-violet text-primary-foreground h-8 text-xs"
                  >
                    Zapisz notatkę
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
