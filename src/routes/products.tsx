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
  Lightbulb,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Crown,
  Zap,
  Gem,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { COVER_CREDIT_COST, generateProductCover } from "@/lib/product-cover.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

type AiCoverFormat =
  | "ebook"
  | "course"
  | "workshop"
  | "masterclass"
  | "template"
  | "checklist"
  | "membership"
  | "coaching"
  | "app"
  | "other";

type AiCoverPresentation = "mockup" | "flat";

const AI_FORMAT_BY_PRODUCT_TYPE: Record<string, AiCoverFormat> = {
  ebook: "ebook",
  kurs: "course",
  warsztat: "workshop",
  aplikacja: "app",
  konsultacje: "coaching",
  abonament: "membership",
  inne: "other",
};

const STATUSES = [
  { v: "idea", l: "Pomysł", color: "bg-orange-soft text-orange" },
  { v: "building", l: "W budowie", color: "bg-blue-soft text-blue" },
  { v: "ready", l: "Gotowy do sprzedaży", color: "bg-violet-soft text-violet" },
  { v: "published", l: "Opublikowany", color: "bg-green/10 text-green" },
] as const;

function pluralizePolish(count: number, one: string, few: string, many: string) {
  if (count === 1) return one;
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return few;
  }
  return many;
}

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
  const [viewedProfile, setViewedProfile] = useState<{
    email: string | null;
    full_name: string | null;
  } | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const adminMode = Boolean(searchUserId && searchUserId !== user?.id);
  const targetUserId = adminMode ? searchUserId! : (user?.id ?? null);

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

  const jumpToStage = useCallback((stage: number) => {
    setOpenStage(stage);
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const createProduct = async () => {
    if (!user) return;
    if (products.length >= limit) {
      toast.error(
        `Twój plan ${plan.toUpperCase()} pozwala na ${limit} produkt(y). Zmień plan, aby dodać więcej.`,
      );
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
    const { error } = await supabase
      .from("user_products")
      .update(patch as never)
      .eq("id", active.id);
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
            Nie przerabiasz kursu — <strong>budujesz swój produkt</strong>, który będziesz
            sprzedawać. Krok po kroku.
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
            <div className="text-xs uppercase font-bold text-orange">
              Podgląd jako administrator
            </div>
            <div className="font-display font-bold truncate">
              {viewedProfile?.full_name || viewedProfile?.email || "Użytkownik"}
              {viewedProfile?.email && viewedProfile?.full_name && (
                <span className="text-muted-foreground font-normal text-sm">
                  {" "}
                  · {viewedProfile.email}
                </span>
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
            {products.length >= limit ? (
              <Lock className="w-3.5 h-3.5 inline mr-1" />
            ) : (
              <Plus className="w-3.5 h-3.5 inline mr-1" />
            )}
            {products.length}/{limit}
          </button>
        )}
      </div>

      {active && score && (
        <>
          <NextStepCard
            nextHint={score.nextStep.hint}
            stage={score.nextStep.stage}
            breakdown={score.breakdown}
            onJump={jumpToStage}
          />

          <HeroCard
            product={active}
            score={score.score}
            onUpdate={updateActive}
            onDelete={deleteProduct}
          />

          {/* JOURNEY — 5 etapów budowy produktu */}
          <ProductJourney
            breakdown={score.breakdown}
            openStage={openStage}
            onSelect={jumpToStage}
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
                nextStage={{
                  num: 2,
                  title: "Oferta sprzedażowa",
                  summary:
                    "Uzupełnisz nagłówek, minimum 3 korzyści, program produktu, bonus, FAQ i CTA.",
                }}
                onContinue={() => jumpToStage(2)}
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
                nextStage={{
                  num: 3,
                  title: "Cena i pakiety",
                  summary: "Dodasz warianty cenowe i wybierzesz pakiet, który chcesz polecać.",
                }}
                onContinue={() => jumpToStage(3)}
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
                nextStage={{
                  num: 4,
                  title: "Materiały produktu",
                  summary: "Dodasz okładkę oraz pliki, workbooki lub linki potrzebne klientowi.",
                }}
                onContinue={() => jumpToStage(4)}
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
                nextStage={{
                  num: 5,
                  title: "Publikacja i sprzedaż",
                  summary: "Przejdziesz checklistę gotowości przed uruchomieniem sprzedaży.",
                }}
                onContinue={() => jumpToStage(5)}
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
        </>
      )}
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  const [aiSubtitle, setAiSubtitle] = useState("");
  const [aiFormat, setAiFormat] = useState<AiCoverFormat>("ebook");
  const [aiPresentation, setAiPresentation] = useState<AiCoverPresentation>("mockup");
  const [aiStyle, setAiStyle] = useState<"modern" | "elegant" | "bold" | "minimal" | "playful">(
    "modern",
  );
  const [aiBusy, setAiBusy] = useState(false);
  const genCover = useServerFn(generateProductCover);
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

  const openAi = () => {
    const seed = [product.promise, product.target_audience, product.problem, product.result]
      .filter(Boolean)
      .join(" — ");
    setAiTitle(product.title || "");
    setAiSubtitle(product.subtitle || "");
    setAiBrief(seed || product.promise || "");
    setAiFormat(AI_FORMAT_BY_PRODUCT_TYPE[product.product_type ?? ""] ?? "other");
    setAiPresentation("mockup");
    setAiOpen(true);
  };

  const runAi = async () => {
    if (aiTitle.trim().length < 1) return toast.error("Podaj tytuł produktu");
    if (aiBrief.trim().length < 3) return toast.error("Opisz krótko produkt");
    setAiBusy(true);
    try {
      const r = await genCover({
        data: {
          productId: product.id,
          brief: aiBrief.trim(),
          title: aiTitle.trim(),
          subtitle: aiSubtitle.trim() || undefined,
          format: aiFormat,
          presentation: aiPresentation,
          style: aiStyle,
        },
      });
      await onUpdate({ cover_url: r.coverUrl });
      toast.success(`Okładka wygenerowana ✨ (−${r.creditsCharged} kredytów)`);
      setAiOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się wygenerować");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="grid lg:grid-cols-[200px_minmax(0,1fr)] gap-0">
        {/* COVER */}
        <div className="bg-muted/40 p-4 lg:p-5 flex flex-col items-center justify-center gap-3">
          <div className="relative w-full max-w-[150px] aspect-[4/5] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            {product.cover_url ? (
              <img
                src={product.cover_url}
                alt={product.title ?? "Okładka produktu"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full grid place-items-center text-center p-4">
                <div>
                  <ImagePlus className="w-9 h-9 mx-auto text-violet mb-2" />
                  <p className="text-xs text-muted-foreground">Dodaj okładkę produktu</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={openAi}
              disabled={uploading || aiBusy}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet to-fuchsia-500 text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiBusy ? "Generuję..." : "Generuj AI"}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || aiBusy}
              className="px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-80 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Wgrywam..." : product.cover_url ? "Zmień" : "Wgraj"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
          />
        </div>

        <Dialog open={aiOpen} onOpenChange={setAiOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>✨ Wygeneruj grafikę produktu AI</DialogTitle>
              <DialogDescription>
                Wybierz rodzaj produktu, a AI przygotuje dopasowany mockup lub płaską okładkę.
                Koszt: <strong>{COVER_CREDIT_COST} kredytów</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Rodzaj produktu</Label>
                <Select value={aiFormat} onValueChange={(v) => setAiFormat(v as typeof aiFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ebook">Ebook / PDF</SelectItem>
                    <SelectItem value="course">Kurs online</SelectItem>
                    <SelectItem value="workshop">Warsztat / Webinar</SelectItem>
                    <SelectItem value="masterclass">Masterclass</SelectItem>
                    <SelectItem value="template">Szablon / Pakiet</SelectItem>
                    <SelectItem value="checklist">Checklista / Cheatsheet</SelectItem>
                    <SelectItem value="membership">Społeczność / Membership</SelectItem>
                    <SelectItem value="coaching">Coaching / Konsultacje</SelectItem>
                    <SelectItem value="app">Aplikacja / SaaS</SelectItem>
                    <SelectItem value="other">Inny produkt cyfrowy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sposób prezentacji</Label>
                <Select
                  value={aiPresentation}
                  onValueChange={(v) => setAiPresentation(v as AiCoverPresentation)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mockup">Mockup produktu (polecane)</SelectItem>
                    <SelectItem value="flat">Płaska okładka / grafika</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Mockup pokaże ebook jako książkę, kurs na ekranie, a szablony jako gotowy pakiet.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tytuł na okładce *</Label>
                  <Input
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    placeholder="np. Marka osobista na Instagramie"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Podtytuł (opcjonalny)</Label>
                  <Input
                    value={aiSubtitle}
                    onChange={(e) => setAiSubtitle(e.target.value)}
                    placeholder="np. Praktyczny przewodnik dla freelancerów"
                    maxLength={120}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Opis i wskazówki dla AI</Label>
                <Textarea
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder="Np. kurs dla freelancerek o budowaniu marki. Kolory: granat i róż. Motyw: pewność siebie i rozwój."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Styl wizualny</Label>
                <Select value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Nowoczesny / tech</SelectItem>
                    <SelectItem value="elegant">Elegancki / premium</SelectItem>
                    <SelectItem value="bold">Mocny / energetyczny</SelectItem>
                    <SelectItem value="minimal">Minimalistyczny</SelectItem>
                    <SelectItem value="playful">Przyjazny / kolorowy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAiOpen(false)} disabled={aiBusy}>
                Anuluj
              </Button>
              <Button
                onClick={runAi}
                disabled={aiBusy}
                className="bg-gradient-to-r from-violet to-fuchsia-500 text-white"
              >
                {aiBusy ? "Generuję..." : "Wygeneruj (−15 kredytów)"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* INFO */}
        <div className="p-5 lg:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Nazwa produktu
                </Label>
                <Input
                  value={product.title ?? ""}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Wpisz nazwę swojego produktu"
                  className="mt-1 min-h-12 rounded-xl border-border/70 bg-background px-4 font-display font-extrabold text-lg sm:text-xl"
                />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Podtytuł
                </Label>
                <Input
                  value={product.subtitle ?? ""}
                  onChange={(e) => onUpdate({ subtitle: e.target.value })}
                  placeholder={'Podtytuł produktu (np. „Praktyczny kurs dla początkujących")'}
                  className="mt-1 h-10 rounded-xl border-border/70 bg-background px-4 text-sm"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="mt-5 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Usuń produkt"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            {/* OBIETNICA */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-violet" />
                Główna obietnica
              </Label>
              <Textarea
                value={product.promise ?? ""}
                onChange={(e) => onUpdate({ promise: e.target.value })}
                placeholder={
                  'Co dokładnie obiecujesz klientowi? (np. „W 14 dni zbudujesz pierwszy produkt cyfrowy")'
                }
                className="min-h-[72px] bg-background border-border/60 rounded-xl resize-none text-sm leading-relaxed"
              />
            </div>

            {/* META: TYP / STATUS / CENA */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                  <Gem className="w-3.5 h-3.5 text-violet" />
                  Typ
                </Label>
                <Select
                  value={product.product_type ?? undefined}
                  onValueChange={(v) => onUpdate({ product_type: v as ProductRow["product_type"] })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/60 bg-background">
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
              <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-violet" />
                  Status
                </Label>
                <Select
                  value={product.status ?? "idea"}
                  onValueChange={(v) => onUpdate({ status: v as ProductRow["status"] })}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border/60 bg-background">
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
              <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-violet" />
                  Cena (PLN)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={product.price_draft ?? ""}
                    onChange={(e) =>
                      onUpdate({ price_draft: e.target.value ? Number(e.target.value) : null })
                    }
                    placeholder="497"
                    className="h-10 rounded-xl border-border/60 bg-background pr-10 font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    zł
                  </span>
                </div>
              </div>
            </div>

            {/* SCORE BAR */}
            <div className="rounded-2xl border border-violet/20 bg-gradient-to-br from-violet-soft/40 to-blue-soft/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                    Gotowość sprzedażowa
                  </span>
                  <Badge
                    className={cn("font-semibold text-[10px] h-5", statusMeta.color)}
                    variant="outline"
                  >
                    {statusMeta.l}
                  </Badge>
                </div>
                <span className="font-display font-extrabold text-2xl text-violet leading-none">
                  {score}
                  <span className="text-muted-foreground text-sm font-bold">/100</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-background/80 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-violet transition-all duration-500 rounded-full"
                  style={{ width: `${score}%` }}
                />
              </div>
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
  breakdown,
  onJump,
}: {
  nextHint: string;
  stage: number;
  breakdown: ScoreBreakdown[];
  onJump: (s: number) => void;
}) {
  const stageMeta = JOURNEY_STAGES.find((item) => item.num === stage) ?? JOURNEY_STAGES[0];
  const stageFields = breakdown.slice(stageMeta.from, stageMeta.to);
  const missingFields = stageFields.filter((field) => !field.done);
  const completedFields = stageFields.length - missingFields.length;

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-violet/30 bg-card shadow-soft">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
        <div className="flex items-start gap-4 bg-gradient-to-br from-violet-soft via-blue-soft to-background p-5 sm:p-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className="border-violet/20 bg-background/80 text-violet" variant="outline">
                Krok {stage} z 5
              </Badge>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {stageMeta.title}
              </span>
            </div>
            <h3 className="font-display text-xl font-extrabold sm:text-2xl">
              {missingFields.length > 0 ? nextHint : `Krok ${stage} jest gotowy`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {missingFields.length > 0
                ? `Uzupełnij brakujące elementy i przejdź dalej. Gotowe ${completedFields}/${stageFields.length}.`
                : "Wszystkie wymagane elementy są uzupełnione. Możesz przejść do kolejnego etapu."}
            </p>
            <Button
              onClick={() => onJump(stage)}
              className="mt-4 bg-gradient-violet text-primary-foreground shadow-soft"
            >
              {missingFields.length > 0 ? `Uzupełnij krok ${stage}` : `Otwórz krok ${stage}`}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-border/70 bg-muted/20 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Do uzupełnienia
              </div>
              <div className="font-display font-bold">
                {missingFields.length === 0
                  ? "Wszystko gotowe"
                  : `${missingFields.length} ${pluralizePolish(
                      missingFields.length,
                      "element",
                      "elementy",
                      "elementów",
                    )}`}
              </div>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-bold text-violet shadow-sm">
              {completedFields}/{stageFields.length}
            </span>
          </div>
          <div className="space-y-2">
            {(missingFields.length > 0 ? missingFields : stageFields).slice(0, 4).map((field) => (
              <div
                key={field.label}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                  field.done
                    ? "border-green/20 bg-green/5 text-green"
                    : "border-border/70 bg-background text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                    field.done
                      ? "border-green bg-green text-white"
                      : "border-violet/40 bg-violet-soft text-violet",
                  )}
                >
                  {field.done ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className="font-medium">{field.label}</span>
              </div>
            ))}
            {missingFields.length > 4 && (
              <div className="pl-1 text-xs font-semibold text-muted-foreground">
                + {missingFields.length - 4} kolejne elementy
              </div>
            )}
          </div>
        </div>
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
            {done.length === 0 && (
              <li className="text-muted-foreground">Jeszcze nic — zacznij od Fundamentu.</li>
            )}
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
type StageMeta = {
  num: number;
  title: string;
  emoji: string;
  from: number;
  to: number;
  gradient: string;
};
const JOURNEY_STAGES: StageMeta[] = [
  { num: 1, title: "Fundament", emoji: "🧱", from: 0, to: 7, gradient: "from-violet to-blue" },
  { num: 2, title: "Oferta", emoji: "💎", from: 7, to: 13, gradient: "from-blue to-cyan-500" },
  { num: 3, title: "Pakiety", emoji: "💰", from: 13, to: 16, gradient: "from-amber-500 to-orange" },
  {
    num: 4,
    title: "Materiały",
    emoji: "📚",
    from: 16,
    to: 18,
    gradient: "from-pink-500 to-violet",
  },
  {
    num: 5,
    title: "Publikacja",
    emoji: "🚀",
    from: 18,
    to: 19,
    gradient: "from-green to-emerald-500",
  },
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
          <p className="text-sm text-muted-foreground">
            Kliknij etap, aby otworzyć edytor poniżej.
          </p>
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
              <div
                className={cn(
                  "relative text-[10px] uppercase tracking-wider font-bold mb-0.5",
                  openStage === s.num ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                Etap {s.num}
              </div>
              <div className="relative font-display font-extrabold text-base mb-3">{s.title}</div>
              <div
                className={cn(
                  "relative h-1.5 rounded-full overflow-hidden",
                  openStage === s.num ? "bg-white/20" : "bg-border",
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    openStage === s.num ? "bg-white" : s.done ? "bg-green" : "bg-gradient-violet",
                  )}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <div
                className={cn(
                  "relative mt-1.5 text-xs font-semibold",
                  openStage === s.num
                    ? "text-primary-foreground/90"
                    : s.done
                      ? "text-green"
                      : s.started
                        ? "text-violet"
                        : "text-muted-foreground",
                )}
              >
                {s.done ? "Gotowe ✓" : s.started ? `${s.pct}%` : "Do zrobienia"}
              </div>
            </button>

            {/* ARROW between boxes (desktop horizontal, mobile vertical) */}
            {idx < stageStats.length - 1 && (
              <div className="flex items-center justify-center" aria-hidden>
                <div className="hidden md:flex items-center">
                  <ArrowRight
                    className={cn(
                      "w-6 h-6 transition-colors",
                      stageStats[idx].done ? "text-green animate-pulse" : "text-violet/50",
                    )}
                  />
                </div>
                <div className="md:hidden flex justify-center py-1">
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 transition-colors",
                      stageStats[idx].done ? "text-green animate-pulse" : "text-violet/50",
                    )}
                  />
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
  nextStage,
  onContinue,
  readyLabel = "Oznacz etap jako gotowy",
}: {
  num: number;
  title: string;
  emoji: string;
  subtitle: string;
  children: React.ReactNode;
  stageBreakdown?: ScoreBreakdown[];
  onMarkReady?: () => Promise<void> | void;
  nextStage?: {
    num: number;
    title: string;
    summary: string;
  };
  onContinue?: () => void;
  readyLabel?: string;
}) {
  const missing = (stageBreakdown ?? []).filter((b) => !b.done);
  const allDone = stageBreakdown ? missing.length === 0 : false;
  const [busy, setBusy] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleMark = async () => {
    if (!allDone) {
      setShowErrors(true);
      toast.error(
        `Uzupełnij ${missing.length} ${pluralizePolish(
          missing.length,
          "pole",
          "pola",
          "pól",
        )}, aby zamknąć ten etap.`,
      );
      return;
    }
    setBusy(true);
    try {
      await onMarkReady?.();
      if (nextStage && onContinue) {
        toast.success(`Krok ${num} ukończony. Przechodzisz do kroku ${nextStage.num}.`);
        onContinue();
      } else {
        toast.success(`Etap ${num} oznaczony jako gotowy 🎉`);
      }
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
          <div className="text-[10px] uppercase tracking-wider font-bold text-violet">
            Etap {num} z 5
          </div>
          <h3 className="font-display font-extrabold text-xl sm:text-2xl">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>

      {stageBreakdown && stageBreakdown.length > 0 && (
        <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Co trzeba uzupełnić w tym kroku
                </div>
                <div className="font-display font-bold">
                  {stageBreakdown.length - missing.length} z {stageBreakdown.length} gotowych
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  allDone ? "bg-green/10 text-green" : "bg-violet-soft text-violet",
                )}
              >
                {allDone ? "Komplet" : `${missing.length} brakuje`}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {stageBreakdown.map((field) => (
                <div
                  key={field.label}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                    field.done ? "border-green/20 bg-green/5" : "border-border/70 bg-background",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                      field.done
                        ? "border-green bg-green text-white"
                        : "border-violet/40 bg-violet-soft text-violet",
                    )}
                  >
                    {field.done ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className={cn("font-semibold", field.done && "text-green")}>
                      {field.label}
                    </div>
                    {!field.done && (
                      <div className="text-xs leading-relaxed text-muted-foreground">
                        {field.hint}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showErrors && !allDone && (
            <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 text-destructive font-semibold text-sm">
                <AlertCircle className="w-4 h-4" />
                Brakuje {missing.length} {pluralizePolish(missing.length, "pola", "pól", "pól")},
                aby zamknąć ten etap:
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
            <div className="rounded-2xl border-2 border-green/40 bg-green/5 p-4">
              <div className="flex items-center gap-2 text-green font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Wszystkie pola tego etapu są wypełnione poprawnie.
              </div>
            </div>
          )}

          {nextStage && (
            <div className="rounded-2xl border border-violet/25 bg-gradient-to-r from-violet-soft to-blue-soft p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-violet">
                Następnie: krok {nextStage.num}
              </div>
              <div className="font-display text-lg font-extrabold">{nextStage.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {nextStage.summary}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={handleMark}
              disabled={busy}
              className={cn(
                "min-h-11 w-full px-5 shadow-soft sm:w-auto",
                allDone
                  ? "bg-gradient-violet text-primary-foreground hover:opacity-90"
                  : "border border-violet/20 bg-violet-soft text-violet hover:bg-violet/15",
              )}
            >
              {allDone ? (
                <ArrowRight className="w-4 h-4 mr-1" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-1" />
              )}
              {allDone && nextStage
                ? `Przejdź do kroku ${nextStage.num}: ${nextStage.title}`
                : allDone
                  ? readyLabel
                  : `Pokaż brakujące pola (${missing.length})`}
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
        required
        minLength={10}
      />
      <Field
        label="Jaki problem rozwiązuje?"
        value={product.problem}
        onChange={(v) => onUpdate({ problem: v })}
        placeholder="Np. Nie wiedzą jak zacząć i ciągle odkładają na później"
        textarea
        required
        minLength={10}
      />
      <Field
        label="Efekt po przejściu produktu"
        value={product.result}
        onChange={(v) => onUpdate({ result: v })}
        placeholder="Np. Mają gotowy do sprzedaży produkt cyfrowy"
        textarea
        required
        minLength={10}
      />
      <Field
        label="Główna obietnica (1 zdanie)"
        value={product.promise}
        onChange={(v) => onUpdate({ promise: v })}
        placeholder="Np. Zbudujesz swój produkt w 14 dni — krok po kroku"
        textarea
        required
        minLength={15}
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
          required
          minLength={10}
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
        required
        minLength={3}
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
type PkgPreset = {
  key: "basic" | "pro" | "vip";
  name: string;
  tagline: string;
  price: number;
  items: string[];
  icon: typeof Zap;
  accent: string;
  ring: string;
};

const PKG_PRESETS: PkgPreset[] = [
  {
    key: "basic",
    name: "Basic",
    tagline: "Wejście do tematu",
    price: 297,
    items: ["Dostęp do kursu", "Materiały PDF", "30 dni dostępu"],
    icon: Zap,
    accent: "from-blue-soft to-violet-soft text-blue",
    ring: "ring-blue/40 border-blue/40",
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Najczęściej wybierany",
    price: 597,
    items: ["Wszystko z Basic", "Sesje grupowe Q&A", "Społeczność", "Bonus: szablony"],
    icon: Crown,
    accent: "from-violet-soft to-orange/20 text-violet",
    ring: "ring-violet/50 border-violet/50",
  },
  {
    key: "vip",
    name: "VIP",
    tagline: "Maksymalna transformacja",
    price: 1497,
    items: ["Wszystko z Pro", "Sesja 1:1 z Tobą", "Priorytetowe wsparcie", "Dożywotni dostęp"],
    icon: Gem,
    accent: "from-orange/20 to-violet-soft text-orange",
    ring: "ring-orange/40 border-orange/40",
  },
];

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
  const addFromPreset = async (preset?: PkgPreset) => {
    if (packages.length >= 3) return toast.error("Max 3 pakiety");
    const fallbackNames = ["Basic", "Pro", "VIP"];
    const payload = preset
      ? {
          product_id: productId,
          user_id: userId,
          name: preset.name,
          price: preset.price,
          description: preset.tagline,
          items: preset.items,
          position: packages.length,
          is_featured: preset.key === "pro" && !packages.some((p) => p.is_featured),
        }
      : {
          product_id: productId,
          user_id: userId,
          name: fallbackNames[packages.length] ?? "Pakiet",
          position: packages.length,
        };
    const { data, error } = await supabase
      .from("user_product_packages")
      .insert(payload)
      .select()
      .single();
    if (error) return toast.error(error.message);
    setPackages((p) => [...p, data as Pkg]);
    toast.success(preset ? `Pakiet ${preset.name} dodany ✨` : "Pakiet dodany");
  };

  const update = async (id: string, patch: Partial<Pkg>) => {
    setPackages((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase
      .from("user_product_packages")
      .update(patch as never)
      .eq("id", id);
  };

  const toggleFeatured = async (id: string, next: boolean) => {
    // Tylko jeden polecany na raz — najpierw wyzeruj resztę
    if (next) {
      setPackages((p) => p.map((x) => ({ ...x, is_featured: x.id === id })));
      await Promise.all(
        packages
          .filter((p) => p.id !== id && p.is_featured)
          .map((p) =>
            supabase
              .from("user_product_packages")
              .update({ is_featured: false } as never)
              .eq("id", p.id),
          ),
      );
      await supabase
        .from("user_product_packages")
        .update({ is_featured: true } as never)
        .eq("id", id);
    } else {
      update(id, { is_featured: false });
    }
  };

  const remove = async (id: string) => {
    setPackages((p) => p.filter((x) => x.id !== id));
    await supabase.from("user_product_packages").delete().eq("id", id);
  };

  const count = packages.length;
  const progressPct = Math.min(100, (count / 3) * 100);
  const usedPresetNames = new Set(packages.map((p) => (p.name ?? "").toLowerCase()));

  return (
    <div className="space-y-6">
      {/* PROGRESS HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-soft via-blue-soft to-violet-soft p-5 border border-violet/20 shadow-soft">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                Pakiety
              </div>
              <div className="font-display font-extrabold text-lg">{count} z 3 gotowych</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center font-bold text-xs transition-all duration-500",
                  i < count
                    ? "bg-gradient-violet text-primary-foreground shadow-glow scale-110"
                    : "bg-background border-2 border-dashed border-violet/30 text-muted-foreground",
                )}
              >
                {i < count ? <Check className="w-4 h-4 animate-scale-in" /> : i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-background/60 overflow-hidden">
          <div
            className="h-full bg-gradient-violet transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute inset-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* PRESET PICKER — gdy brak pakietów lub zostało miejsce */}
      {count < 3 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-orange" />
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              {count === 0 ? "Wybierz szablon, by zacząć szybko" : "Dodaj kolejny pakiet"}
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {PKG_PRESETS.map((preset) => {
              const used = usedPresetNames.has(preset.name.toLowerCase());
              const Icon = preset.icon;
              return (
                <button
                  key={preset.key}
                  type="button"
                  disabled={used}
                  onClick={() => addFromPreset(preset)}
                  className={cn(
                    "group relative text-left rounded-2xl border-2 p-4 transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-glow hover:-translate-y-0.5",
                    "active:scale-[0.98]",
                    used
                      ? "opacity-50 cursor-not-allowed border-border bg-muted/30"
                      : cn("bg-gradient-to-br cursor-pointer", preset.accent, preset.ring),
                  )}
                >
                  {preset.key === "pro" && !used && (
                    <div className="absolute -top-2 -right-2 bg-orange text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-soft uppercase tracking-wider animate-pulse">
                      Polecany
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-background/80 grid place-items-center shadow-soft group-hover:rotate-6 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-display font-extrabold text-base">{preset.name}</div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {preset.tagline}
                      </div>
                    </div>
                  </div>
                  <div className="font-display font-extrabold text-2xl mb-2">
                    {preset.price}{" "}
                    <span className="text-xs text-muted-foreground font-semibold">PLN</span>
                  </div>
                  <ul className="space-y-1">
                    {preset.items.slice(0, 3).map((it, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <Check className="w-3 h-3 mt-0.5 text-green shrink-0" />
                        <span className="text-muted-foreground">{it}</span>
                      </li>
                    ))}
                  </ul>
                  {used ? (
                    <div className="mt-3 text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3" /> Dodany
                    </div>
                  ) : (
                    <div className="mt-3 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Dodaj <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => addFromPreset()}
            className="w-full rounded-2xl border-2 border-dashed border-violet/30 p-3 text-sm font-semibold text-violet hover:bg-violet-soft transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> lub zacznij od pustego pakietu
          </button>
        </div>
      )}

      {/* AKTYWNE PAKIETY — duże karty */}
      {count > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green" />
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Twoje pakiety
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg, idx) => (
              <PkgCard
                key={pkg.id}
                pkg={pkg}
                index={idx}
                onUpdate={(patch) => update(pkg.id, patch)}
                onToggleFeatured={(next) => toggleFeatured(pkg.id, next)}
                onRemove={() => remove(pkg.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PkgCard({
  pkg,
  index,
  onUpdate,
  onToggleFeatured,
  onRemove,
}: {
  pkg: Pkg;
  index: number;
  onUpdate: (patch: Partial<Pkg>) => void;
  onToggleFeatured: (next: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        "relative rounded-3xl border-2 p-5 space-y-3 transition-all duration-300 animate-scale-in",
        pkg.is_featured
          ? "border-violet bg-gradient-to-br from-violet-soft via-background to-blue-soft ring-2 ring-violet/40 shadow-glow"
          : "border-border bg-card hover:border-violet/30",
      )}
    >
      {pkg.is_featured && (
        <div className="absolute -top-3 left-4 bg-gradient-violet text-primary-foreground text-[10px] font-extrabold px-3 py-1 rounded-full shadow-glow uppercase tracking-wider flex items-center gap-1">
          <Crown className="w-3 h-3" /> Polecany
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <Input
          value={pkg.name ?? ""}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nazwa pakietu"
          className="font-display font-extrabold text-lg border-0 px-0 focus-visible:ring-0 h-auto bg-transparent"
        />
        <button
          type="button"
          onClick={() => onToggleFeatured(!pkg.is_featured)}
          title={pkg.is_featured ? "Usuń wyróżnienie" : "Oznacz jako polecany"}
          className={cn(
            "shrink-0 w-9 h-9 rounded-xl grid place-items-center transition-all duration-300",
            pkg.is_featured
              ? "bg-gradient-violet text-primary-foreground shadow-glow scale-110"
              : "bg-muted text-muted-foreground hover:text-orange hover:bg-orange/10",
          )}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-transform",
              pkg.is_featured && "fill-current animate-pulse",
            )}
          />
        </button>
      </div>

      <div className="rounded-2xl bg-background/60 border border-border p-3">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          Cena
        </div>
        <div className="flex items-baseline gap-1.5">
          <Input
            type="number"
            value={pkg.price ?? ""}
            onChange={(e) => onUpdate({ price: e.target.value ? Number(e.target.value) : null })}
            placeholder="497"
            className="font-display font-extrabold text-3xl border-0 px-0 focus-visible:ring-0 h-auto bg-transparent"
          />
          <span className="text-muted-foreground font-bold text-sm">PLN</span>
        </div>
      </div>

      <Textarea
        value={pkg.description ?? ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Co dostaje klient w skrócie..."
        className="text-sm min-h-[60px] resize-none"
      />

      <PkgItems
        items={(pkg.items as string[] | undefined) ?? []}
        onChange={(items) => onUpdate({ items })}
      />

      <button
        type="button"
        onClick={onRemove}
        className="w-full text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-destructive/5"
      >
        <Trash2 className="w-3 h-3" /> Usuń pakiet
      </button>
    </div>
  );
}

function PkgItems({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        Co zawiera ({items.length})
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="group flex items-start gap-2 text-sm rounded-lg px-2 py-1.5 bg-green/5 border border-green/20 animate-scale-in"
          >
            <div className="w-5 h-5 rounded-full bg-green grid place-items-center shrink-0 mt-0.5 shadow-soft">
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="flex-1 leading-snug">{it}</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              aria-label="Usuń"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Dodaj funkcję pakietu..."
          className="text-sm h-9"
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={!draft.trim()}
          className="h-9 px-3 bg-gradient-violet text-primary-foreground shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
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
          <li
            key={m.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20"
          >
            <span className="text-xl">
              {m.kind === "link" ? "🔗" : m.kind === "pdf" ? "📄" : "📎"}
            </span>
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
            <button
              onClick={() => remove(m.id)}
              className="text-muted-foreground hover:text-destructive p-1"
            >
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
              <span
                className={cn("text-sm", checklist[it.key] && "line-through text-muted-foreground")}
              >
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
          <span
            className={cn(
              "text-[10px] tabular-nums",
              trimmed.length >= minLength ? "text-green" : "text-muted-foreground",
            )}
          >
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
