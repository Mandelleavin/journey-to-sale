import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeProductScore } from "@/lib/product-score";

export const Route = createFileRoute("/admin/user-products")({
  head: () => ({
    meta: [{ title: "Produkty użytkowników — Admin" }],
  }),
  component: AdminUserProducts,
});

type Row = {
  id: string;
  user_id: string;
  title: string | null;
  status: string | null;
  cover_url: string | null;
  updated_at: string;
  email: string | null;
  full_name: string | null;
  score: number;
};

function AdminUserProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: prods } = await supabase
        .from("user_products")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200);
      const ids = Array.from(new Set((prods ?? []).map((p) => p.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, email, full_name").in("id", ids)
        : { data: [] };
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

      const merged: Row[] = await Promise.all(
        (prods ?? []).map(async (p) => {
          const [{ data: pkgs }, { data: mats }] = await Promise.all([
            supabase.from("user_product_packages").select("*").eq("product_id", p.id),
            supabase.from("user_product_materials").select("*").eq("product_id", p.id),
          ]);
          const { score } = computeProductScore(
            // deno-fmt-ignore
            p as Parameters<typeof computeProductScore>[0],
            (pkgs ?? []) as Parameters<typeof computeProductScore>[1],
            (mats ?? []) as Parameters<typeof computeProductScore>[2],
          );
          const prof = profMap.get(p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            title: p.title,
            status: p.status,
            cover_url: p.cover_url,
            updated_at: p.updated_at,
            email: prof?.email ?? null,
            full_name: prof?.full_name ?? null,
            score,
          };
        }),
      );
      setRows(merged);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [r.title, r.email, r.full_name].some((x) => (x ?? "").toLowerCase().includes(s));
  });

  return (
    <PageShell title="Produkty użytkowników" subtitle="Podgląd produktów budowanych w aplikacji">
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj po tytule, email, nazwisku..."
          className="flex-1 h-10 px-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet/40"
        />
        <Link to="/admin" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Panel admina
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Ładowanie...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Brak produktów do wyświetlenia.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to="/products"
              search={{ userId: r.user_id }}
              className="group rounded-2xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-glow hover:-translate-y-0.5 transition-all"
            >
              <div className="aspect-[4/2] bg-gradient-to-br from-violet-soft to-blue-soft grid place-items-center overflow-hidden">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-violet/60" />
                )}
              </div>
              <div className="p-4">
                <div className="font-display font-bold truncate">{r.title || "Bez nazwy"}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.full_name || r.email || r.user_id.slice(0, 8)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                    r.status === "published" ? "bg-green/10 text-green"
                      : r.status === "ready" ? "bg-violet-soft text-violet"
                      : r.status === "building" ? "bg-blue-soft text-blue"
                      : "bg-orange-soft text-orange",
                  )}>
                    {r.status ?? "idea"}
                  </span>
                  <span className="text-xs font-bold text-violet group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    {r.score}/100 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
