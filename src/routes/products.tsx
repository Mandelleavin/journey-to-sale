import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Check,
  ImagePlus,
  Lock,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  Upload,
  Wand2,
  FileDown,
  Lightbulb,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  computeProductScore,
  PLAN_PRODUCT_LIMITS,
  PUBLISH_CHECKLIST_ITEMS,
  type MaterialRow,
  type PackageRow,
  type ProductRow,
  type ScoreBreakdown,
} from "@/lib/product-score";

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>) => ({
    userId: typeof s.userId === "string" ? s.userId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mój Produkt — kreator oferty sprzedażowej" },
      {
        name: "description",
        content:
          "Zbuduj swój produkt krok po kroku: nazwa, obietnica, oferta, pakiety, materiały i publikacja.",
      },
    ],
  }),
  component: ProductsPage,
});

type Product = ProductRow & { id: string };
type Pkg = PackageRow & { description?: string | null; items?: string[]; currency?: string };
type Material = MaterialRow & { title?: string | null };

const PRODUCT_TYPES = [
  { v: "ebook", l: "Ebook" },
  { v: "kurs", l: "Kurs" },
  { v: "warsztat", l: "Warsztat" },
  { v: "aplikacja", l: "Aplikacja" },
  { v: "konsultacje", l: "Konsultacje" },
  { v: "abonament", l: "Abonament" },
  { v: "inne", l: "Inne" },
] as const;

const STATUSES = [
  { v: "idea", l: "Pomysł", color: "bg-orange-soft text-orange" },
  { v: "building", l: "W budowie", color: "bg-blue-soft text-blue" },
  { v: "ready", l: "Gotowy do sprzedaży", color: "bg-violet-soft text-violet" },
  { v: "published", l: "Opublikowany", color: "bg-green/10 text-green" },
] as const;

function ProductsPage() {
  const { user } = useAuth();
  const { userId: searchUserId } = Route.useSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [plan, setPlan] = useState<string>("start");
  const [loading, setLoading] = useState(true);
  const [openStage, setOpenStage] = useState<number>(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<{ email: string | null; full_name: string | null } | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const adminMode = Boolean(searchUserId && searchUserId !== user?.id);
  const targetUserId = adminMode ? searchUserId! : user?.id ?? null;

  const active = products.find((p) => p.id === activeId) ?? null;
  const limit = PLAN_PRODUCT_LIMITS[plan] ?? 1;

  // detect admin role
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  const loadAll = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    const [{ data: prods }, { data: sub }, { data: prof }] = await Promise.all([
      supabase
        .from("user_products")
        .select("*")
        .eq("user_id", targetUserId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("user_subscriptions").select("plan").eq("user_id", targetUserId).maybeSingle(),
      adminMode
        ? supabase.from("profiles").select("email, full_name").eq("id", targetUserId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setProducts((prods ?? []) as Product[]);
    setPlan((sub?.plan as string) ?? "start");
    setViewedProfile(prof ?? null);
    if (prods && prods.length > 0 && !activeId) setActiveId(prods[0].id);
    setLoading(false);
  }, [targetUserId, adminMode, activeId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);


  // load packages + materials for active product
  useEffect(() => {
    if (!activeId) {
      setPackages([]);
      setMaterials([]);
      return;
    }
    (async () => {
      const [{ data: pkgs }, { data: mats }] = await Promise.all([
        supabase
          .from("user_product_packages")
          .select("*")
          .eq("product_id", activeId)
          .order("position"),
        supabase
          .from("user_product_materials")
          .select("*")
          .eq("product_id", activeId)
          .order("position"),
      ]);
      setPackages((pkgs ?? []) as Pkg[]);
      setMaterials((mats ?? []) as Material[]);
    })();
  }, [activeId]);

  const score = useMemo(
    () => (active ? computeProductScore(active, packages, materials) : null),
    [active, packages, materials],
  );

  const createProduct = async () => {
    if (!user) return;
    if (products.length >= limit) {
      toast.error(`Twój plan ${plan.toUpperCase()} pozwala na ${limit} produkt(y). Zmień plan, aby dodać więcej.`);
      return;
    }
    const { data, error } = await supabase
      .from("user_products")
      .insert({ user_id: user.id, title: "Mój nowy produkt", position: products.length })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setProducts((p) => [...p, data as Product]);
    setActiveId(data.id);
    setOpenStage(1);
    toast.success("Produkt utworzony");
  };

  const updateActive = async (patch: Partial<Product>) => {
    if (!active) return;
    setProducts((ps) => ps.map((p) => (p.id === active.id ? { ...p, ...patch } : p)));
    const { error } = await supabase.from("user_products").update(patch as never).eq("id", active.id);
    if (error) toast.error(error.message);
  };

  const deleteProduct = async () => {
    if (!active) return;
    if (!confirm("Usunąć ten produkt? Operacji nie można cofnąć.")) return;
    const { error } = await supabase.from("user_products").delete().eq("id", active.id);
    if (error) return toast.error(error.message);
    setProducts((p) => p.filter((x) => x.id !== active.id));
    setActiveId(null);
    toast.success("Usunięto");
  };

  if (loading) {
    return (
      <PageShell title="Mój Produkt" subtitle="Kreator Twojej oferty sprzedażowej">
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Ładowanie...
        </div>
      </PageShell>
    );
  }

  // EMPTY STATE
  if (products.length === 0) {
    return (
      <PageShell title="Mój Produkt" subtitle="Kreator Twojej oferty sprzedażowej">
        <div className="rounded-3xl border-2 border-dashed border-violet/30 bg-gradient-to-br from-violet-soft to-blue-soft p-10 text-center shadow-soft">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-violet grid place-items-center shadow-glow mb-5">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="font-display font-extrabold text-2xl mb-2">
            Stwórz swój pierwszy produkt
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Nie przerabiasz kursu — <strong>budujesz swój produkt</strong>, który będziesz sprzedawać. Krok po kroku.
          </p>
          <Button
            size="lg"
            onClick={createProduct}
            className="bg-gradient-violet text-primary-foreground shadow-glow"
          >
            <Plus className="w-5 h-5 mr-2" />
            Dodaj mój produkt
          </Button>
        </div>
        <CourseModulesLink />
      </PageShell>
    );
  }

  return (
    <PageShell title="Mój Produkt" subtitle="Centrum dowodzenia Twoim produktem">
      {/* ADMIN PREVIEW BANNER */}
      {adminMode && (
        <div className="rounded-2xl border-2 border-orange/40 bg-orange-soft p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-orange grid place-items-center text-white shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase font-bold text-orange">Podgląd jako administrator</div>
            <div className="font-display font-bold truncate">
              {viewedProfile?.full_name || viewedProfile?.email || "Użytkownik"}
              {viewedProfile?.email && viewedProfile?.full_name && (
                <span className="text-muted-foreground font-normal text-sm"> · {viewedProfile.email}</span>
              )}
            </div>
          </div>
          <Link to="/admin" className="text-sm font-semibold text-orange hover:underline shrink-0">
            ← Wróć
          </Link>
        </div>
      )}

      {/* PRODUCT SELECTOR */}
      <div className="flex items-center gap-2 flex-wrap">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold border transition-all",
              p.id === activeId
                ? "bg-gradient-violet text-primary-foreground border-transparent shadow-glow"
                : "bg-card border-border hover:border-violet/40",
            )}
          >
            {p.title || "Bez nazwy"}
          </button>
        ))}
        {!adminMode && (
          <button
            onClick={createProduct}
            disabled={products.length >= limit}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-dashed transition-all",
              products.length >= limit
                ? "border-muted text-muted-foreground cursor-not-allowed"
                : "border-violet/40 text-violet hover:bg-violet-soft",
            )}
            title={
              products.length >= limit
                ? `Twój plan ${plan.toUpperCase()} pozwala na ${limit} produkt(y)`
                : "Dodaj produkt"
            }
          >
            {products.length >= limit ? <Lock className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}
            {products.length}/{limit}
          </button>
        )}
      </div>

      {active && score && (
        <>
          <HeroCard
            product={active}
            score={score.score}
            onUpdate={updateActive}
            onDelete={deleteProduct}
          />

          <NextStepCard
            nextHint={score.nextStep.hint}
            stage={score.nextStep.stage}
            onJump={(s) => setOpenStage(s)}
          />

          {/* JOURNEY — 5 wielkich boxów ze strzałkami */}
          <ProductJourney
            breakdown={score.breakdown}
            openStage={openStage}
            onSelect={(s) => {
              setOpenStage(s);
              requestAnimationFrame(() => {
                editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
          />

          {/* AKTYWNY EDYTOR ETAPU */}
          <div ref={editorRef} key={openStage} className="animate-fade-in scroll-mt-20">
            {openStage === 1 && (
              <StageEditor
                num={1}
                title="Fundament Produktu"
                emoji="🧱"
                subtitle="Nazwa, obietnica, dla kogo i jaki rezultat dajesz."
                stageBreakdown={score.breakdown.slice(0, 7)}
                onMarkReady={async () => {
                  if (active.status === "idea") await updateActive({ status: "building" });
                }}
              >
                <StageFundament product={active} onUpdate={updateActive} />
              </StageEditor>
            )}
            {openStage === 2 && (
              <StageEditor
                num={2}
                title="Oferta Sprzedażowa"
                emoji="💎"
                subtitle="Nagłówek, korzyści, agenda, bonusy i FAQ."
                stageBreakdown={score.breakdown.slice(7, 13)}
              >
                <StageOffer product={active} onUpdate={updateActive} />
              </StageEditor>
            )}
            {openStage === 3 && (
              <StageEditor
                num={3}
                title="Cena i Pakiety"
                emoji="💰"
                subtitle="Zbuduj 1–3 pakiety i wyróżnij polecany."
                stageBreakdown={score.breakdown.slice(13, 16)}
              >
                <StagePricing
                  productId={active.id}
                  userId={targetUserId!}
                  packages={packages}
                  setPackages={setPackages}
                />
              </StageEditor>
            )}
            {openStage === 4 && (
              <StageEditor
                num={4}
                title="Materiały Produktu"
                emoji="📚"
                subtitle="Wgraj okładkę, PDF-y, workbooki i linki."
                stageBreakdown={score.breakdown.slice(16, 18)}
              >
                <StageMaterials
                  productId={active.id}
                  userId={targetUserId!}
                  materials={materials}
                  setMaterials={setMaterials}
                />
              </StageEditor>
            )}
            {openStage === 5 && (
              <StageEditor
                num={5}
                title="Publikacja i Sprzedaż"
                emoji="🚀"
                subtitle="Checklista gotowości przed startem sprzedaży."
                stageBreakdown={score.breakdown.slice(18)}
                onMarkReady={async () => {
                  await updateActive({ status: "ready" });
                }}
                readyLabel="Oznacz produkt jako gotowy do sprzedaży"
              >
                <StagePublish product={active} score={score.score} onUpdate={updateActive} />
              </StageEditor>
            )}
          </div>


          <ScoreCard breakdown={score.breakdown} score={score.score} onJump={setOpenStage} />

          {/* EXPORTS (placeholder) */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-3">
              <FileDown className="w-5 h-5 text-violet" /> Eksporty
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Wygenerujesz PDF oferty, tabelę cen i 7-dniowy plan sprzedaży. Funkcja wkrótce.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled>
                <FileDown className="w-4 h-4 mr-2" /> PDF oferty (wkrótce)
              </Button>
              <Button variant="outline" disabled>
                <FileDown className="w-4 h-4 mr-2" /> Tabela cen (wkrótce)
              </Button>
              <Button variant="outline" disabled>
                <Wand2 className="w-4 h-4 mr-2" /> Plan sprzedaży 7 dni (wkrótce)
              </Button>
            </div>
          </div>
        </>
      )}


      <CourseModulesLink />
    </PageShell>
  );
}

/* ---------------- HERO ---------------- */
function HeroCard({
  product,
  score,
  onUpdate,
  onDelete,
}: {
  product: Product;
  score: number;
  onUpdate: (p: Partial<Product>) => Promise<void>;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const statusMeta = STATUSES.find((s) => s.v === product.status) ?? STATUSES[0];

  const uploadCover = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${product.id}/cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-assets").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("product-assets").getPublicUrl(path);
    await onUpdate({ cover_url: data.publicUrl });
    setUploading(false);
    toast.success("Okładka wgrana");
  };

  return (
    <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="grid lg:grid-cols-[260px,1fr] gap-0">
        {/* COVER */}
        <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[280px] bg-gradient-to-br from-violet-soft to-blue-soft grid place-items-center">
          {product.cover_url ? (
            <img
              src={product.cover_url}
              alt={product.title ?? "Okładka produktu"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <ImagePlus className="w-10 h-10 mx-auto text-violet mb-2" />
              <p className="text-xs text-muted-foreground">Wgraj okładkę produktu</p>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold hover:bg-black flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Wgrywam..." : product.cover_url ? "Zmień" : "Wgraj"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
          />
        </div>

        {/* INFO */}
        <div className="p-5 lg:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0 space-y-1">
              <Input
                value={product.title ?? ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Nazwa produktu"
                className="font-display font-extrabold text-2xl border-0 px-0 focus-visible:ring-0 h-auto py-0"
              />
              <Input
                value={product.subtitle ?? ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                placeholder={'Podtytuł produktu (np. „Praktyczny kurs dla początkujących")'}
                className="text-sm text-muted-foreground border-0 px-0 focus-visible:ring-0 h-auto py-0"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label className="text-xs uppercase font-bold text-muted-foreground">Główna obietnica</Label>
            <Textarea
              value={product.promise ?? ""}
              onChange={(e) => onUpdate({ promise: e.target.value })}
              placeholder={'Co dokładnie obiecujesz klientowi? (np. „W 14 dni zbudujesz pierwszy produkt cyfrowy")'}
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase font-bold text-muted-foreground">Typ</Label>
              <Select
                value={product.product_type ?? undefined}
                onValueChange={(v) => onUpdate({ product_type: v as ProductRow["product_type"] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wybierz" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t.v} value={t.v}>
                      {t.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-muted-foreground">Status</Label>
              <Select
                value={product.status ?? "idea"}
                onValueChange={(v) => onUpdate({ status: v as ProductRow["status"] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.v} value={s.v}>
                      {s.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-muted-foreground">Cena robocza (PLN)</Label>
              <Input
                type="number"
                value={product.price_draft ?? ""}
                onChange={(e) =>
                  onUpdate({ price_draft: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="497"
                className="mt-1"
              />
            </div>
          </div>

          {/* SCORE BAR */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase font-bold text-muted-foreground">
                Gotowość sprzedażowa
              </span>
              <span className="font-display font-extrabold text-lg text-violet">
                {score}<span className="text-muted-foreground text-sm">/100</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-violet transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={cn("font-semibold", statusMeta.color)} variant="outline">
                {statusMeta.l}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- NEXT STEP ---------------- */
function NextStepCard({
  nextHint,
  stage,
  onJump,
}: {
  nextHint: string;
  stage: number;
  onJump: (s: number) => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-violet/30 bg-gradient-to-r from-violet-soft via-blue-soft to-violet-soft p-5 shadow-soft">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow shrink-0">
          <Target className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase font-bold text-muted-foreground">Twój następny krok</div>
          <div className="font-display font-extrabold text-lg">{nextHint}</div>
        </div>
        <Button onClick={() => onJump(stage)} className="bg-gradient-violet text-primary-foreground">
          Wykonaj <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- SCORE BREAKDOWN ---------------- */
function ScoreCard({
  breakdown,
  score,
  onJump,
}: {
  breakdown: ReturnType<typeof computeProductScore>["breakdown"];
  score: number;
  onJump: (s: number) => void;
}) {
  const done = breakdown.filter((b) => b.done);
  const todo = breakdown.filter((b) => !b.done);
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet" /> Produkt Score: {score}/100
        </h3>
        {todo.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => onJump(1)}>
            Popraw wynik <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-green mb-2">
            ✓ Gotowe ({done.length})
          </div>
          <ul className="space-y-1 text-sm">
            {done.length === 0 && <li className="text-muted-foreground">Jeszcze nic — zacznij od Fundamentu.</li>}
            {done.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-foreground">
                <Check className="w-3.5 h-3.5 text-green shrink-0" /> {b.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-orange mb-2">
            ⚡ Do poprawy ({todo.length})
          </div>
          <ul className="space-y-1 text-sm">
            {todo.length === 0 && <li className="text-green font-semibold">Wszystko gotowe! 🎉</li>}
            {todo.map((b, i) => (
              <li key={i} className="text-muted-foreground">
                • {b.hint}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PRODUCT JOURNEY (5 boxów ze strzałkami) ---------------- */
type StageMeta = { num: number; title: string; emoji: string; from: number; to: number; gradient: string };
const JOURNEY_STAGES: StageMeta[] = [
  { num: 1, title: "Fundament",  emoji: "🧱", from: 0,  to: 7,  gradient: "from-violet to-blue" },
  { num: 2, title: "Oferta",     emoji: "💎", from: 7,  to: 13, gradient: "from-blue to-cyan-500" },
  { num: 3, title: "Pakiety",    emoji: "💰", from: 13, to: 16, gradient: "from-amber-500 to-orange" },
  { num: 4, title: "Materiały",  emoji: "📚", from: 16, to: 18, gradient: "from-pink-500 to-violet" },
  { num: 5, title: "Publikacja", emoji: "🚀", from: 18, to: 19, gradient: "from-green to-emerald-500" },
];

function ProductJourney({
  breakdown,
  openStage,
  onSelect,
}: {
  breakdown: ReturnType<typeof computeProductScore>["breakdown"];
  openStage: number;
  onSelect: (n: number) => void;
}) {
  const stageStats = JOURNEY_STAGES.map((s) => {
    const slice = breakdown.slice(s.from, s.to);
    const max = slice.reduce((a, x) => a + x.max, 0);
    const earned = slice.reduce((a, x) => a + x.earned, 0);
    const pct = max === 0 ? 0 : Math.round((earned / max) * 100);
    const done = pct === 100;
    const started = earned > 0;
    return { ...s, max, earned, pct, done, started };
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-extrabold text-lg sm:text-xl">Mapa budowy produktu</h3>
          <p className="text-sm text-muted-foreground">Kliknij etap, aby otworzyć edytor poniżej.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 md:gap-2 items-stretch">
        {stageStats.map((s, idx) => (
          <Fragment key={s.num}>
            <button
              onClick={() => onSelect(s.num)}
              className={cn(
                "group relative text-left rounded-2xl border-2 p-4 transition-all duration-300 overflow-hidden",
                "hover:-translate-y-1 hover:shadow-glow focus:outline-none",
                openStage === s.num
                  ? "border-violet bg-gradient-violet text-primary-foreground shadow-glow scale-[1.02]"
                  : s.done
                    ? "border-green/40 bg-green/5 hover:border-green"
                    : s.started
                      ? "border-violet/40 bg-violet-soft hover:border-violet"
                      : "border-border bg-muted/30 hover:border-violet/40",
              )}
            >
              {/* shimmer on active */}
              {openStage === s.num && (
                <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.5),transparent)] bg-[length:200%_100%] animate-[shimmer_2.5s_linear_infinite]" />
              )}
              <div className="relative flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "w-8 h-8 rounded-xl grid place-items-center text-sm font-bold shrink-0",
                    openStage === s.num
                      ? "bg-white/20 text-primary-foreground"
                      : s.done
                        ? "bg-green text-white"
                        : "bg-card border border-border",
                  )}
                >
                  {s.done ? <Check className="w-4 h-4" /> : s.num}
                </span>
                <span className="text-2xl">{s.emoji}</span>
              </div>
              <div className={cn(
                "relative text-[10px] uppercase tracking-wider font-bold mb-0.5",
                openStage === s.num ? "text-primary-foreground/80" : "text-muted-foreground",
              )}>
                Etap {s.num}
              </div>
              <div className="relative font-display font-extrabold text-base mb-3">{s.title}</div>
              <div className={cn(
                "relative h-1.5 rounded-full overflow-hidden",
                openStage === s.num ? "bg-white/20" : "bg-border",
              )}>
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    openStage === s.num
                      ? "bg-white"
                      : s.done
                        ? "bg-green"
                        : "bg-gradient-violet",
                  )}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <div className={cn(
                "relative mt-1.5 text-xs font-semibold",
                openStage === s.num
                  ? "text-primary-foreground/90"
                  : s.done
                    ? "text-green"
                    : s.started
                      ? "text-violet"
                      : "text-muted-foreground",
              )}>
                {s.done ? "Gotowe ✓" : s.started ? `${s.pct}%` : "Do zrobienia"}
              </div>
            </button>

            {/* ARROW between boxes (desktop horizontal, mobile vertical) */}
            {idx < stageStats.length - 1 && (
              <div className="flex items-center justify-center" aria-hidden>
                <div className="hidden md:flex items-center">
                  <ArrowRight className={cn(
                    "w-6 h-6 transition-colors",
                    stageStats[idx].done ? "text-green animate-pulse" : "text-violet/50",
                  )} />
                </div>
                <div className="md:hidden flex justify-center py-1">
                  <ChevronDown className={cn(
                    "w-5 h-5 transition-colors",
                    stageStats[idx].done ? "text-green animate-pulse" : "text-violet/50",
                  )} />
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------------- STAGE EDITOR (duży box dla aktywnego etapu) ---------------- */
function StageEditor({
  num,
  title,
  emoji,
  subtitle,
  children,
  stageBreakdown,
  onMarkReady,
  readyLabel = "Oznacz etap jako gotowy",
}: {
  num: number;
  title: string;
  emoji: string;
  subtitle: string;
  children: React.ReactNode;
  stageBreakdown?: ScoreBreakdown[];
  onMarkReady?: () => Promise<void> | void;
  readyLabel?: string;
}) {
  const missing = (stageBreakdown ?? []).filter((b) => !b.done);
  const allDone = stageBreakdown ? missing.length === 0 : false;
  const [busy, setBusy] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleMark = async () => {
    if (!allDone) {
      setShowErrors(true);
      toast.error(`Uzupełnij ${missing.length} ${missing.length === 1 ? "pole" : "pola/pól"}, aby zamknąć ten etap.`);
      return;
    }
    setBusy(true);
    try {
      await onMarkReady?.();
      toast.success(`Etap ${num} oznaczony jako gotowy 🎉`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-violet/30 bg-card shadow-soft overflow-hidden animate-scale-in">
      <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-soft to-blue-soft border-b-2 border-violet/20 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground text-2xl shadow-glow shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-bold text-violet">Etap {num} z 5</div>
          <h3 className="font-display font-extrabold text-xl sm:text-2xl">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>

      {stageBreakdown && stageBreakdown.length > 0 && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
          {showErrors && !allDone && (
            <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 text-destructive font-semibold text-sm">
                <AlertCircle className="w-4 h-4" />
                Brakuje {missing.length} {missing.length === 1 ? "pola" : "pól"} aby zamknąć ten etap:
              </div>
              <ul className="space-y-1 text-sm pl-6">
                {missing.map((m, i) => (
                  <li key={i} className="text-destructive list-disc">
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-muted-foreground"> — {m.hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allDone && (
            <div className="rounded-2xl border-2 border-green/40 bg-green/5 p-4 flex items-center gap-2 text-green font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Wszystkie pola tego etapu są wypełnione poprawnie.
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              Gotowe: <span className="font-bold text-foreground">{stageBreakdown.length - missing.length}/{stageBreakdown.length}</span>
            </div>
            <Button
              onClick={handleMark}
              disabled={busy}
              className={cn(
                "shadow-soft",
                allDone
                  ? "bg-gradient-to-r from-green to-emerald-500 text-white hover:opacity-90"
                  : "bg-muted text-muted-foreground hover:bg-muted",
              )}
            >
              {allDone ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
              {readyLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ---------------- STAGE 1: FUNDAMENT ---------------- */
function StageFundament({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: (p: Partial<Product>) => Promise<void>;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field
        label="Dla kogo jest produkt?"
        value={product.target_audience}
        onChange={(v) => onUpdate({ target_audience: v })}
        placeholder="Np. Początkujący twórcy kursów online"
        textarea
      />
      <Field
        label="Jaki problem rozwiązuje?"
        value={product.problem}
        onChange={(v) => onUpdate({ problem: v })}
        placeholder="Np. Nie wiedzą jak zacząć i ciągle odkładają na później"
        textarea
      />
      <Field
        label="Efekt po przejściu produktu"
        value={product.result}
        onChange={(v) => onUpdate({ result: v })}
        placeholder="Np. Mają gotowy do sprzedaży produkt cyfrowy"
        textarea
      />
      <Field
        label="Główna obietnica (1 zdanie)"
        value={product.promise}
        onChange={(v) => onUpdate({ promise: v })}
        placeholder="Np. Zbudujesz swój produkt w 14 dni — krok po kroku"
        textarea
      />
    </div>
  );
}

/* ---------------- STAGE 2: OFFER ---------------- */
function StageOffer({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: (p: Partial<Product>) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field
          label="Nagłówek sprzedażowy"
          value={product.sales_headline}
          onChange={(v) => onUpdate({ sales_headline: v })}
          placeholder="Np. Twój pierwszy produkt cyfrowy w 14 dni"
        />
        <Field
          label="Podtytuł sprzedażowy"
          value={product.sales_subtitle}
          onChange={(v) => onUpdate({ sales_subtitle: v })}
          placeholder="Bez perfekcjonizmu, bez utknięcia"
        />
      </div>
      <Field
        label="Etykieta CTA"
        value={product.cta_label}
        onChange={(v) => onUpdate({ cta_label: v })}
        placeholder="Np. Kupuję teraz"
      />
      <ListField
        label="Lista korzyści"
        items={(product.benefits as string[] | null) ?? []}
        onChange={(v) => onUpdate({ benefits: v })}
        placeholder="Konkretna korzyść dla klienta"
      />
      <ListField
        label="Agenda (moduły / tematy)"
        items={(product.agenda as string[] | null) ?? []}
        onChange={(v) => onUpdate({ agenda: v })}
        placeholder="Temat / moduł"
      />
      <ListField
        label="Bonusy"
        items={(product.bonuses as string[] | null) ?? []}
        onChange={(v) => onUpdate({ bonuses: v })}
        placeholder="Bonus (np. checklista, szablon)"
      />
      <FaqField
        items={(product.faq as { q: string; a: string }[] | null) ?? []}
        onChange={(v) => onUpdate({ faq: v })}
      />
    </div>
  );
}

/* ---------------- STAGE 3: PRICING ---------------- */
function StagePricing({
  productId,
  userId,
  packages,
  setPackages,
}: {
  productId: string;
  userId: string;
  packages: Pkg[];
  setPackages: React.Dispatch<React.SetStateAction<Pkg[]>>;
}) {
  const add = async () => {
    if (packages.length >= 3) return toast.error("Max 3 pakiety");
    const names = ["Basic", "Pro", "VIP"];
    const { data, error } = await supabase
      .from("user_product_packages")
      .insert({
        product_id: productId,
        user_id: userId,
        name: names[packages.length] ?? "Pakiet",
        position: packages.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setPackages((p) => [...p, data as Pkg]);
  };

  const update = async (id: string, patch: Partial<Pkg>) => {
    setPackages((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("user_product_packages").update(patch as never).eq("id", id);
  };

  const remove = async (id: string) => {
    setPackages((p) => p.filter((x) => x.id !== id));
    await supabase.from("user_product_packages").delete().eq("id", id);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={cn(
              "rounded-2xl border p-4 space-y-3 transition-all",
              pkg.is_featured
                ? "border-violet bg-gradient-to-br from-violet-soft to-blue-soft ring-2 ring-violet/40"
                : "border-border bg-card",
            )}
          >
            <div className="flex items-center justify-between">
              <Input
                value={pkg.name ?? ""}
                onChange={(e) => update(pkg.id, { name: e.target.value })}
                placeholder="Nazwa"
                className="font-bold border-0 px-0 focus-visible:ring-0 h-auto"
              />
              <button
                onClick={() => update(pkg.id, { is_featured: !pkg.is_featured })}
                title="Oznacz polecany"
                className={cn(
                  "p-1 rounded transition-colors",
                  pkg.is_featured ? "text-orange" : "text-muted-foreground hover:text-orange",
                )}
              >
                <Star className={cn("w-4 h-4", pkg.is_featured && "fill-orange")} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={pkg.price ?? ""}
                onChange={(e) =>
                  update(pkg.id, { price: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="497"
                className="font-display font-extrabold text-2xl"
              />
              <span className="text-muted-foreground font-semibold">PLN</span>
            </div>
            <Textarea
              value={pkg.description ?? ""}
              onChange={(e) => update(pkg.id, { description: e.target.value })}
              placeholder="Krótki opis"
              className="text-sm min-h-[50px]"
            />
            <PkgItems
              items={(pkg.items as string[] | undefined) ?? []}
              onChange={(items) => update(pkg.id, { items })}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(pkg.id)}
              className="text-destructive hover:text-destructive w-full"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Usuń pakiet
            </Button>
          </div>
        ))}
        {packages.length < 3 && (
          <button
            onClick={add}
            className="rounded-2xl border-2 border-dashed border-violet/40 p-4 min-h-[200px] grid place-items-center text-violet hover:bg-violet-soft transition-colors"
          >
            <div className="text-center">
              <Plus className="w-6 h-6 mx-auto mb-1" />
              <span className="font-semibold text-sm">Dodaj pakiet</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function PkgItems({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-1.5">
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5 text-sm">
            <Check className="w-3.5 h-3.5 mt-0.5 text-green shrink-0" />
            <span className="flex-1">{it}</span>
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-muted-foreground hover:text-destructive"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
          placeholder="Co zawiera pakiet..."
          className="text-xs h-8"
        />
      </div>
    </div>
  );
}

/* ---------------- STAGE 4: MATERIALS ---------------- */
function StageMaterials({
  productId,
  userId,
  materials,
  setMaterials,
}: {
  productId: string;
  userId: string;
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState({ title: "", url: "" });

  const KINDS = ["pdf", "workbook", "presentation", "graphic", "bonus", "sales", "link"];

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage
      .from("product-assets")
      .upload(path, file, { upsert: false });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data: pub } = supabase.storage.from("product-assets").getPublicUrl(path);
    const { data, error: err2 } = await supabase
      .from("user_product_materials")
      .insert({
        product_id: productId,
        user_id: userId,
        title: file.name,
        kind: ext === "pdf" ? "pdf" : "bonus",
        file_url: pub.publicUrl,
        position: materials.length,
      })
      .select()
      .single();
    setUploading(false);
    if (err2) return toast.error(err2.message);
    setMaterials((m) => [...m, data as Material]);
    toast.success("Materiał dodany");
  };

  const addLink = async () => {
    if (!linkDraft.url.trim()) return;
    const { data, error } = await supabase
      .from("user_product_materials")
      .insert({
        product_id: productId,
        user_id: userId,
        title: linkDraft.title || linkDraft.url,
        kind: "link",
        external_link: linkDraft.url,
        position: materials.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setMaterials((m) => [...m, data as Material]);
    setLinkDraft({ title: "", url: "" });
  };

  const remove = async (id: string) => {
    setMaterials((m) => m.filter((x) => x.id !== id));
    await supabase.from("user_product_materials").delete().eq("id", id);
  };

  const updateKind = async (id: string, kind: string) => {
    setMaterials((m) => m.map((x) => (x.id === id ? { ...x, kind } : x)));
    await supabase.from("user_product_materials").update({ kind }).eq("id", id);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border-2 border-dashed border-violet/40 p-5 text-center hover:bg-violet-soft transition-colors"
        >
          <Upload className="w-6 h-6 mx-auto text-violet mb-1" />
          <div className="font-semibold text-sm">
            {uploading ? "Wgrywanie..." : "Wgraj plik (PDF, grafika, prezentacja)"}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </button>
        <div className="rounded-2xl border-2 border-dashed border-blue/40 p-3 space-y-2">
          <div className="font-semibold text-sm text-center text-blue">Lub dodaj link</div>
          <Input
            value={linkDraft.title}
            onChange={(e) => setLinkDraft({ ...linkDraft, title: e.target.value })}
            placeholder="Tytuł (np. Nagranie wprowadzające)"
            className="text-sm"
          />
          <div className="flex gap-1">
            <Input
              value={linkDraft.url}
              onChange={(e) => setLinkDraft({ ...linkDraft, url: e.target.value })}
              placeholder="https://..."
              className="text-sm"
            />
            <Button size="sm" onClick={addLink}>
              Dodaj
            </Button>
          </div>
        </div>
      </div>

      {materials.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Biblioteka jest pusta — dodaj pierwszy materiał.
        </p>
      )}

      <ul className="space-y-1.5">
        {materials.map((m) => (
          <li key={m.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20">
            <span className="text-xl">{m.kind === "link" ? "🔗" : m.kind === "pdf" ? "📄" : "📎"}</span>
            <a
              href={m.file_url ?? m.external_link ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm font-medium hover:text-violet truncate"
            >
              {m.title}
            </a>
            <Select value={m.kind ?? "pdf"} onValueChange={(v) => updateKind(m.id, v)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- STAGE 5: PUBLISH ---------------- */
function StagePublish({
  product,
  score,
  onUpdate,
}: {
  product: Product;
  score: number;
  onUpdate: (p: Partial<Product>) => Promise<void>;
}) {
  const checklist = (product.publish_checklist as Record<string, boolean>) ?? {};
  const toggle = (k: string) =>
    onUpdate({ publish_checklist: { ...checklist, [k]: !checklist[k] } });

  const done = Object.values(checklist).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <ul className="space-y-1.5">
        {PUBLISH_CHECKLIST_ITEMS.map((it) => (
          <li key={it.key}>
            <button
              onClick={() => toggle(it.key)}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/50 text-left transition-colors"
            >
              <span
                className={cn(
                  "w-5 h-5 rounded border grid place-items-center shrink-0",
                  checklist[it.key]
                    ? "bg-green border-green text-white"
                    : "border-muted-foreground/40",
                )}
              >
                {checklist[it.key] && <Check className="w-3.5 h-3.5" />}
              </span>
              <span className={cn("text-sm", checklist[it.key] && "line-through text-muted-foreground")}>
                {it.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-gradient-to-r from-violet-soft to-blue-soft p-4 text-center">
        <Lightbulb className="w-6 h-6 mx-auto text-violet mb-1" />
        <p className="font-semibold text-sm">
          Twój produkt jest gotowy w <span className="text-violet font-extrabold">{score}%</span>. 
          Odhacz pozycje ({done}/{PUBLISH_CHECKLIST_ITEMS.length}), aby przygotować go do sprzedaży.
        </p>
      </div>
    </div>
  );
}

/* ---------------- REUSABLE FIELDS ---------------- */
function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  required,
  minLength,
  maxLength,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [touched, setTouched] = useState(false);
  useEffect(() => setLocal(value ?? ""), [value]);
  const Cmp = textarea ? Textarea : Input;

  const trimmed = local.trim();
  let error: string | null = null;
  if (touched) {
    if (required && trimmed.length === 0) error = "To pole jest wymagane.";
    else if (minLength && trimmed.length > 0 && trimmed.length < minLength)
      error = `Wpisz minimum ${minLength} znaków (masz ${trimmed.length}).`;
    else if (maxLength && trimmed.length > maxLength)
      error = `Maksymalnie ${maxLength} znaków (masz ${trimmed.length}).`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase font-bold text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {minLength && (
          <span className={cn(
            "text-[10px] tabular-nums",
            trimmed.length >= minLength ? "text-green" : "text-muted-foreground",
          )}>
            {trimmed.length}/{minLength}
          </span>
        )}
      </div>
      <Cmp
        value={local}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setLocal(e.target.value);
          if (!touched) setTouched(true);
        }}
        onBlur={() => {
          setTouched(true);
          if (local !== (value ?? "")) onChange(local);
        }}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-1",
          textarea && "min-h-[80px]",
          error && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function ListField({
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
  const [draft, setDraft] = useState("");
  const list = Array.isArray(items) ? items : [];
  return (
    <div>
      <Label className="text-xs uppercase font-bold text-muted-foreground">{label}</Label>
      <ul className="mt-1 space-y-1">
        {list.map((it, i) => (
          <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
            <Check className="w-3.5 h-3.5 text-green shrink-0" />
            <span className="flex-1">{it}</span>
            <button
              onClick={() => onChange(list.filter((_, idx) => idx !== i))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1 mt-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...list, draft.trim()]);
              setDraft("");
            }
          }}
          placeholder={placeholder}
        />
        <Button
          type="button"
          onClick={() => {
            if (draft.trim()) {
              onChange([...list, draft.trim()]);
              setDraft("");
            }
          }}
        >
          Dodaj
        </Button>
      </div>
    </div>
  );
}

function FaqField({
  items,
  onChange,
}: {
  items: { q: string; a: string }[];
  onChange: (v: { q: string; a: string }[]) => void;
}) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div>
      <Label className="text-xs uppercase font-bold text-muted-foreground">FAQ</Label>
      <div className="mt-1 space-y-2">
        {list.map((f, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/20 p-2 space-y-1">
            <div className="flex gap-1">
              <Input
                value={f.q}
                onChange={(e) => {
                  const next = [...list];
                  next[i] = { ...next[i], q: e.target.value };
                  onChange(next);
                }}
                placeholder="Pytanie"
                className="font-semibold text-sm"
              />
              <button
                onClick={() => onChange(list.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Textarea
              value={f.a}
              onChange={(e) => {
                const next = [...list];
                next[i] = { ...next[i], a: e.target.value };
                onChange(next);
              }}
              placeholder="Odpowiedź"
              className="text-sm min-h-[50px]"
            />
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => onChange([...list, { q: "", a: "" }])}
      >
        <Plus className="w-3.5 h-3.5 mr-1" /> Dodaj pytanie
      </Button>
    </div>
  );
}

/* ---------------- LINK TO COURSE MODULES ---------------- */
function CourseModulesLink() {
  return (
    <Link
      to="/course-builder"
      className="block rounded-2xl border border-border bg-card hover:border-violet/40 transition-all p-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🗺️</span>
        <div className="flex-1">
          <div className="font-display font-bold text-sm">Mapa kursu: 7 modułów</div>
          <div className="text-xs text-muted-foreground">
            Lekcje, zadania i checklisty — przejdź do widoku modułów.
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-violet" />
      </div>
    </Link>
  );
}
