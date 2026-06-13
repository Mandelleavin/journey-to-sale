import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  adminListRecommendedTools,
  upsertRecommendedTool,
  deleteRecommendedTool,
  upsertToolCategory,
  deleteToolCategory,
  type ToolInput,
  type CategoryInput,
} from "@/lib/recommended-tools.functions";
import type { RecommendedTool, ToolCategory } from "@/lib/recommended-tools-data";
import { GRADIENT_PRESETS } from "@/lib/recommended-tools-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  X,
  Crown,
  EyeOff,
  Eye,
  GripVertical,
  Tag as TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/recommended-tools")({
  component: AdminRecommendedToolsPage,
});

function AdminRecommendedToolsPage() {
  const router = useRouter();
  const fetchAll = useServerFn(adminListRecommendedTools);
  const [data, setData] = useState<{ categories: ToolCategory[]; tools: RecommendedTool[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTool, setEditingTool] = useState<RecommendedTool | "new" | null>(null);
  const [editingCategory, setEditingCategory] = useState<ToolCategory | "new" | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchAll();
      setData(res);
    } catch (e) {
      toast.error("Nie udało się załadować danych");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !data) {
    return <div className="p-6 text-muted-foreground">Ładowanie panelu narzędzi…</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">Polecane narzędzia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzaj listą narzędzi afiliacyjnych — dodawaj, edytuj, ukrywaj.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditingCategory("new")}>
            <TagIcon className="w-4 h-4" /> Nowa kategoria
          </Button>
          <Button onClick={() => setEditingTool("new")} className="bg-gradient-violet text-primary-foreground">
            <Plus className="w-4 h-4" /> Nowe narzędzie
          </Button>
        </div>
      </header>

      {/* Categories */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Kategorie</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data.categories.map((c) => (
            <div
              key={c.slug}
              className="rounded-2xl border border-border p-3 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} grid place-items-center text-xl shrink-0`}
              >
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{c.slug}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setEditingCategory(c)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={async () => {
                  if (!confirm(`Usunąć kategorię "${c.name}"?`)) return;
                  try {
                    await deleteToolCategory({ data: { slug: c.slug } });
                    toast.success("Usunięto");
                    reload();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Błąd — może zawiera narzędzia.");
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-orange" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grouped by category */}
      <section className="space-y-6">
        {data.categories.map((cat) => {
          const tools = data.tools.filter((t) => t.category === cat.slug);
          return (
            <div key={cat.slug} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
                <span>{cat.emoji}</span> {cat.name}
                <span className="text-xs font-normal text-muted-foreground">({tools.length})</span>
              </h3>
              {tools.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak narzędzi w tej kategorii.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {tools.map((t) => (
                    <li key={t.slug} className="flex items-center gap-3 py-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} grid place-items-center text-white font-display font-extrabold shrink-0`}
                      >
                        {t.letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{t.name}</span>
                          {t.gold && (
                            <Badge className="bg-amber-400 text-amber-950 border-0 h-5">
                              <Crown className="w-3 h-3 mr-1" /> Top
                            </Badge>
                          )}
                          {!t.isPublished && (
                            <Badge variant="outline" className="h-5">
                              <EyeOff className="w-3 h-3 mr-1" /> Ukryte
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{t.shortDescription}</div>
                      </div>
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        poz. {t.position}
                      </span>
                      <Button size="icon" variant="ghost" onClick={() => setEditingTool(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm(`Usunąć "${t.name}"?`)) return;
                          try {
                            await deleteRecommendedTool({ data: { slug: t.slug } });
                            toast.success("Usunięto");
                            reload();
                          } catch (e: any) {
                            toast.error(e?.message ?? "Błąd");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-orange" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {editingTool && (
        <ToolEditorDialog
          initial={editingTool === "new" ? null : editingTool}
          categories={data.categories}
          onClose={() => setEditingTool(null)}
          onSaved={() => {
            setEditingTool(null);
            reload();
            router.invalidate();
          }}
        />
      )}

      {editingCategory && (
        <CategoryEditorDialog
          initial={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => {
            setEditingCategory(null);
            reload();
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}

// ============ Tool editor ============

function ToolEditorDialog({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: RecommendedTool | null;
  categories: ToolCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ToolInput>(() => ({
    slug: initial?.slug ?? "",
    originalSlug: initial?.slug,
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? "",
    shortDescription: initial?.shortDescription ?? "",
    longDescription: initial?.longDescription ?? "",
    category: initial?.category ?? categories[0]?.slug ?? "",
    url: initial?.url ?? "https://",
    gold: initial?.gold ?? false,
    perk: initial?.perk ?? "",
    letter: initial?.letter ?? "X",
    gradient: initial?.gradient ?? GRADIENT_PRESETS[0],
    tags: initial?.tags ?? [],
    rating: initial?.rating ?? 4.7,
    reviewsCount: initial?.reviewsCount ?? 100,
    usedBy: initial?.usedBy ?? 10,
    launchedYear: initial?.launchedYear ?? null,
    website: initial?.website ?? "",
    pros: initial?.pros ?? [],
    cons: initial?.cons ?? [],
    bestFor: initial?.bestFor ?? [],
    features: initial?.features ?? [],
    pricing: initial?.pricing ?? [],
    faq: initial?.faq ?? [],
    alternatives: initial?.alternatives ?? [],
    position: initial?.position ?? 0,
    isPublished: initial?.isPublished ?? true,
  }));

  const set = <K extends keyof ToolInput>(k: K, v: ToolInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertRecommendedTool({
        data: { ...form, perk: form.perk || null, website: form.website || null },
      });
      toast.success("Zapisano");
      onSaved();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Błąd zapisu — sprawdź pola.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell title={initial ? `Edytuj: ${initial.name}` : "Nowe narzędzie"} onClose={onClose}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nazwa">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Slug (URL)" hint="małe litery, cyfry, myślniki">
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Tagline (krótki podtytuł)">
          <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </Field>
        <Field label="Kategoria">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Link afiliacyjny (URL)">
          <Input value={form.url} onChange={(e) => set("url", e.target.value)} />
        </Field>
        <Field label="Strona WWW (tekst)">
          <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
        </Field>
        <Field label="Litera (logo)">
          <Input maxLength={4} value={form.letter} onChange={(e) => set("letter", e.target.value)} />
        </Field>
        <Field label="Gradient">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.gradient}
            onChange={(e) => set("gradient", e.target.value)}
          >
            {GRADIENT_PRESETS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ocena (0–5)">
          <Input
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={form.rating}
            onChange={(e) => set("rating", Number(e.target.value))}
          />
        </Field>
        <Field label="Liczba opinii">
          <Input
            type="number"
            value={form.reviewsCount}
            onChange={(e) => set("reviewsCount", Number(e.target.value))}
          />
        </Field>
        <Field label="Używa (osób)">
          <Input
            type="number"
            value={form.usedBy}
            onChange={(e) => set("usedBy", Number(e.target.value))}
          />
        </Field>
        <Field label="Rok powstania">
          <Input
            type="number"
            value={form.launchedYear ?? ""}
            onChange={(e) =>
              set("launchedYear", e.target.value ? Number(e.target.value) : null)
            }
          />
        </Field>
        <Field label="Pozycja w kategorii">
          <Input
            type="number"
            value={form.position}
            onChange={(e) => set("position", Number(e.target.value))}
          />
        </Field>
        <div className="flex items-center gap-6 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.gold} onChange={(e) => set("gold", e.target.checked)} />
            <Crown className="w-4 h-4 text-amber-500" /> Top pick (złota odznaka)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
            />
            {form.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}{" "}
            Opublikowane
          </label>
        </div>
      </div>

      <Field label="Bonus (perk)">
        <Input value={form.perk ?? ""} onChange={(e) => set("perk", e.target.value)} placeholder='np. 30 dni gratis' />
      </Field>

      <Field label="Krótki opis (na liście)">
        <Textarea
          rows={2}
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
      </Field>

      <Field label="Pełny opis (na stronie narzędzia)">
        <Textarea
          rows={5}
          value={form.longDescription}
          onChange={(e) => set("longDescription", e.target.value)}
        />
      </Field>

      <ListEditor label="Tagi" items={form.tags} onChange={(v) => set("tags", v)} placeholder="np. Newsletter" />
      <ListEditor label="Plusy" items={form.pros} onChange={(v) => set("pros", v)} placeholder="Zaleta" />
      <ListEditor label="Minusy" items={form.cons} onChange={(v) => set("cons", v)} placeholder="Wada" />
      <ListEditor
        label="Dla kogo najlepsze"
        items={form.bestFor}
        onChange={(v) => set("bestFor", v)}
        placeholder="np. Twórcy kursów online"
      />

      <ObjectListEditor
        label="Funkcje"
        items={form.features}
        onChange={(v) => set("features", v)}
        fields={[
          { key: "title", label: "Tytuł" },
          { key: "description", label: "Opis", textarea: true },
        ]}
        empty={{ title: "", description: "" }}
      />

      <ObjectListEditor
        label="Cennik"
        items={form.pricing}
        onChange={(v) => set("pricing", v)}
        fields={[
          { key: "plan", label: "Plan" },
          { key: "price", label: "Cena" },
          { key: "note", label: "Notka (opcjonalnie)" },
        ]}
        empty={{ plan: "", price: "", note: "" }}
      />

      <ObjectListEditor
        label="FAQ"
        items={form.faq}
        onChange={(v) => set("faq", v)}
        fields={[
          { key: "q", label: "Pytanie" },
          { key: "a", label: "Odpowiedź", textarea: true },
        ]}
        empty={{ q: "", a: "" }}
      />

      <ListEditor
        label="Alternatywy (slugi innych narzędzi)"
        items={form.alternatives}
        onChange={(v) => set("alternatives", v)}
        placeholder="np. mailerlite"
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-border sticky bottom-0 bg-card">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Anuluj
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-violet text-primary-foreground">
          <Save className="w-4 h-4" /> {saving ? "Zapisywanie…" : "Zapisz"}
        </Button>
      </div>
    </DialogShell>
  );
}

// ============ Category editor ============

function CategoryEditorDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: ToolCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryInput>(() => ({
    slug: initial?.slug ?? "",
    originalSlug: initial?.slug,
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    emoji: initial?.emoji ?? "✨",
    gradient: initial?.gradient ?? GRADIENT_PRESETS[0],
    position: initial?.position ?? 0,
  }));
  const set = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertToolCategory({ data: form });
      toast.success("Zapisano");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell title={initial ? `Edytuj kategorię: ${initial.name}` : "Nowa kategoria"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nazwa">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Slug">
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Emoji">
          <Input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} />
        </Field>
        <Field label="Pozycja">
          <Input
            type="number"
            value={form.position}
            onChange={(e) => set("position", Number(e.target.value))}
          />
        </Field>
        <Field label="Gradient" className="col-span-2">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.gradient}
            onChange={(e) => set("gradient", e.target.value)}
          >
            {GRADIENT_PRESETS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Opis">
        <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Anuluj
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-violet text-primary-foreground">
          <Save className="w-4 h-4" /> {saving ? "Zapisywanie…" : "Zapisz"}
        </Button>
      </div>
    </DialogShell>
  );
}

// ============ Reusable bits ============

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-3xl rounded-3xl border border-border shadow-card my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card flex items-center justify-between p-5 border-b border-border z-10">
          <h2 className="font-display font-extrabold text-lg">{title}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="w-4 h-4 text-orange" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange([...items, ""])}>
          <Plus className="w-3 h-3" /> Dodaj
        </Button>
      </div>
    </Field>
  );
}

function ObjectListEditor<T extends Record<string, string>>(props: {
  label,
  items,
  onChange,
  fields,
  empty,
}: {
  label: string;
  items: T[];
  onChange: (v: T[]) => void;
  fields: { key: keyof T & string; label: string; textarea?: boolean }[];
  empty: T;
}) {
  return (
    <Field label={label}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-border p-3 space-y-2 relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-1 right-1"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="w-4 h-4 text-orange" />
            </Button>
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">{f.label}</Label>
                {f.textarea ? (
                  <Textarea
                    rows={2}
                    value={(item[f.key] as string) ?? ""}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], [f.key]: e.target.value };
                      onChange(next);
                    }}
                  />
                ) : (
                  <Input
                    value={(item[f.key] as string) ?? ""}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], [f.key]: e.target.value };
                      onChange(next);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange([...items, { ...empty }])}>
          <Plus className="w-3 h-3" /> Dodaj
        </Button>
      </div>
    </Field>
  );
}
