import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  MessageSquare,
  Trash2,
  Send,
  Users,
  Sparkles,
  Rocket,
  Megaphone,
  ShoppingCart,
  TrendingUp,
  HelpCircle,
  Clock,
  Shield,
  Check,
  X,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAKE_NAMES = [
  "Anna","Marek","Kasia","Tomek","Magda","Piotr","Ola","Bartek",
  "Natalia","Krzysiek","Justyna","Adam","Ewa","Michał","Paulina","Wojtek",
];

const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const firstName = (full?: string | null) =>
  (full ?? "Użytkownik").trim().split(/\s+/)[0] || "Użytkownik";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Społeczność — 90 Dni" },
      { name: "description", content: "Dziel się postępami, pytaj, pomagaj innym uczestnikom." },
    ],
  }),
  component: CommunityPage,
});

const CATEGORIES = [
  { key: "general", label: "Ogólne", icon: HelpCircle, gradient: "from-violet to-blue" },
  { key: "landing_page", label: "Landing Page", icon: Rocket, gradient: "from-blue to-cyan-500" },
  { key: "reklama", label: "Reklama", icon: Megaphone, gradient: "from-orange to-pink-500" },
  { key: "oto", label: "OTO", icon: ShoppingCart, gradient: "from-green to-emerald-500" },
  { key: "skalowanie", label: "Skalowanie", icon: TrendingUp, gradient: "from-pink-500 to-rose-500" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

type Post = {
  id: string;
  user_id: string;
  content: string;
  category: string;
  created_at: string;
  is_approved: boolean;
  is_example: boolean;
  author_name?: string | null;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string | null;
};

function CommunityPage() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [onlineCount, setOnlineCount] = useState(34);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const load = async () => {
    setLoading(true);
    const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const [{ data: p }, { data: c }, { data: prof }, { count: onlineReal }] = await Promise.all([
      supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase.from("community_comments").select("*").order("created_at"),
      supabase.from("profiles").select("id, full_name"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen", sinceIso),
    ]);
    const nameMap = new Map((prof ?? []).map((x) => [x.id, x.full_name]));
    const enrichedPosts = ((p ?? []) as Post[]).map((x) => ({
      ...x,
      author_name: x.is_example
        ? FAKE_NAMES[hashString(x.id) % FAKE_NAMES.length]
        : firstName(nameMap.get(x.user_id)),
    }));
    const grouped: Record<string, Comment[]> = {};
    ((c ?? []) as Comment[]).forEach((cm) => {
      const enriched = { ...cm, author_name: firstName(nameMap.get(cm.user_id)) };
      (grouped[cm.post_id] ??= []).push(enriched);
    });
    setPosts(enrichedPosts);
    setComments(grouped);
    setOnlineCount((onlineReal ?? 0) + 34);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const post = async () => {
    if (!user || !content.trim()) return;
    const needsModeration = category !== "general";
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      category,
      is_approved: !needsModeration || isAdmin,
    });
    if (error) return toast.error(error.message);
    setContent("");
    if (needsModeration && !isAdmin) {
      toast.success("Wysłane do moderacji. Pojawi się po akceptacji.");
    } else {
      toast.success("Opublikowano!");
    }
    load();
  };

  const comment = async (postId: string) => {
    const text = commentInput[postId];
    if (!user || !text?.trim()) return;
    const { error } = await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });
    if (error) return toast.error(error.message);
    setCommentInput((s) => ({ ...s, [postId]: "" }));
    load();
  };

  const removePost = async (id: string) => {
    if (!confirm("Usunąć wpis?")) return;
    await supabase.from("community_posts").delete().eq("id", id);
    load();
  };

  const moderate = async (id: string, approve: boolean) => {
    if (approve) {
      await supabase.from("community_posts").update({ is_approved: true }).eq("id", id);
    } else {
      await supabase.from("community_posts").delete().eq("id", id);
    }
    load();
  };

  const q = search.trim().toLowerCase();
  const visible = posts
    .filter((p) => {
      if (!p.is_approved && !isAdmin && p.user_id !== user?.id) return false;
      if (filter === "pending") return !p.is_approved;
      if (filter !== "all" && p.category !== filter) return false;
      if (q) {
        return (
          p.content.toLowerCase().includes(q) ||
          (p.author_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });

  const pendingCount = posts.filter((p) => !p.is_approved).length;

  return (
    <PageShell title="Społeczność" subtitle="Dziel się sukcesami, pytaj, pomagaj innym.">
      {/* HERO online counter */}
      <div className="rounded-3xl bg-gradient-to-br from-violet to-blue p-5 text-white shadow-glow">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-white/20 grid place-items-center">
              <Users className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green border-2 border-white animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase opacity-80 tracking-wider">
                Społeczność live
              </div>
              <div className="font-display font-extrabold text-2xl">
                {onlineCount} <span className="text-base font-medium opacity-90">online teraz</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-90">
            <Sparkles className="w-4 h-4" />
            {posts.filter((p) => p.is_approved).length} aktywnych wątków
          </div>
        </div>
      </div>

      {/* CATEGORY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((c) => {
          const count = posts.filter((p) => p.category === c.key && p.is_approved).length;
          const Icon = c.icon;
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(active ? "all" : c.key)}
              className={cn(
                "rounded-2xl p-4 text-left transition-all hover:shadow-card",
                active ? "ring-2 ring-violet shadow-card" : "",
                "bg-gradient-to-br text-white shadow-soft",
                c.gradient,
              )}
            >
              <Icon className="w-6 h-6" />
              <div className="mt-2 font-display font-bold text-sm">{c.label}</div>
              <div className="text-[11px] opacity-80">{count} wątków</div>
            </button>
          );
        })}
      </div>

      {/* COMPOSER */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Co u Ciebie? Podziel się postępem lub zapytaj o radę..."
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    category === c.key
                      ? "bg-gradient-violet text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <Button onClick={post} className="bg-gradient-violet text-primary-foreground">
              <Send className="w-4 h-4 mr-1" /> Opublikuj
            </Button>
          </div>
          {category !== "general" && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3" /> Wpisy w tej kategorii są moderowane przed publikacją.
            </p>
          )}
        </div>
      </div>

      {/* SEARCH + SORT */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj wpisów lub autorów..."
            className="pl-9"
          />
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setSort("newest")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold",
              sort === "newest" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            Najnowsze
          </button>
          <button
            onClick={() => setSort("oldest")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold",
              sort === "oldest" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            Najstarsze
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-1 flex-wrap items-center">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold uppercase",
            filter === "all"
              ? "bg-gradient-violet text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          Wszystko
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold uppercase",
              filter === c.key
                ? "bg-gradient-violet text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
        {isAdmin && pendingCount > 0 && (
          <button
            onClick={() => setFilter("pending")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold uppercase",
              filter === "pending"
                ? "bg-orange text-white"
                : "bg-orange/10 text-orange",
            )}
          >
            Do moderacji ({pendingCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Brak wpisów. Bądź pierwszy!
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => {
            const cat = CAT_MAP[p.category] ?? CATEGORIES[0];
            const CatIcon = cat.icon;
            const initials = (p.author_name ?? "U").slice(0, 2).toUpperCase();
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl grid place-items-center text-white font-bold text-xs shrink-0 bg-gradient-to-br",
                        cat.gradient,
                      )}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{p.author_name}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] inline-flex items-center gap-1"
                        >
                          <CatIcon className="w-3 h-3" /> {cat.label}
                        </Badge>
                        {!p.is_example && (
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(p.created_at).toLocaleString("pl-PL")}
                          </span>
                        )}
                        {!p.is_approved && (
                          <Badge variant="outline" className="text-[10px] border-orange/40 text-orange">
                            Oczekuje moderacji
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isAdmin && !p.is_approved && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green h-7"
                          onClick={() => moderate(p.id, true)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7"
                          onClick={() => moderate(p.id, false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {(user?.id === p.user_id || isAdmin) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive h-7"
                        onClick={() => removePost(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm mt-3 whitespace-pre-wrap">{p.content}</p>

                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {(comments[p.id] ?? []).map((c) => (
                    <div key={c.id} className="text-xs rounded-lg bg-muted/40 p-2">
                      <b>{c.author_name}:</b> {c.content}
                    </div>
                  ))}
                  {p.is_approved && (
                    <div className="flex gap-2">
                      <Textarea
                        value={commentInput[p.id] ?? ""}
                        onChange={(e) =>
                          setCommentInput((s) => ({ ...s, [p.id]: e.target.value }))
                        }
                        placeholder="Dodaj komentarz..."
                        className="min-h-[40px] text-xs"
                      />
                      <Button size="sm" onClick={() => comment(p.id)} variant="outline">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
