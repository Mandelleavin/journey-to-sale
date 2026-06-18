import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
  ChevronDown,
  ChevronUp,
  CircleHelp,
  PartyPopper,
  Flame,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAKE_NAMES = [
  "Anna",
  "Marek",
  "Kasia",
  "Tomek",
  "Magda",
  "Piotr",
  "Ola",
  "Bartek",
  "Natalia",
  "Krzysiek",
  "Justyna",
  "Adam",
  "Ewa",
  "Michał",
  "Paulina",
  "Wojtek",
];

const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const firstName = (full?: string | null) =>
  (full ?? "Użytkownik").trim().split(/\s+/)[0] || "Użytkownik";

const relativeTime = (value: string) => {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return "przed chwilą";
  if (diffMinutes < 60) return `${diffMinutes} min temu`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  return new Date(value).toLocaleDateString("pl-PL");
};

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
  {
    key: "skalowanie",
    label: "Skalowanie",
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-500",
  },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const POST_STARTERS = [
  {
    label: "Pokaż postęp",
    icon: TrendingUp,
    text: "Dziś zrobiłem/am:\n\nMój kolejny krok to:",
  },
  {
    label: "Zadaj pytanie",
    icon: CircleHelp,
    text: "Potrzebuję pomocy z:\n\nPróbowałem/am już:",
  },
  {
    label: "Świętuj sukces",
    icon: PartyPopper,
    text: "Mały lub duży sukces tego tygodnia:\n\nNajważniejsza lekcja:",
  },
];

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
  const userId = user?.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [activePeople, setActivePeople] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [feedMode, setFeedMode] = useState<"newest" | "active" | "unanswered">("newest");
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [posting, setPosting] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const [{ data: p }, { data: c }, { data: prof }] = await Promise.all([
        supabase
          .from("community_posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(80),
        supabase.from("community_comments").select("*").order("created_at"),
        supabase.from("profiles").select("id, full_name, last_seen"),
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
      const activeProfiles = (prof ?? [])
        .filter((profile) => profile.last_seen && profile.last_seen >= sinceIso)
        .sort((a, b) => (b.last_seen ?? "").localeCompare(a.last_seen ?? ""));
      const activityEstimate = 15 + (Math.floor(Date.now() / 300000) % 16);
      const nextOnlineCount = Math.min(30, Math.max(15, activityEstimate + activeProfiles.length));
      const currentProfile = userId ? (prof ?? []).find((profile) => profile.id === userId) : null;
      const realActivePeople = [
        ...(currentProfile
          ? [{ id: currentProfile.id, name: firstName(currentProfile.full_name) }]
          : []),
        ...activeProfiles
          .filter((profile) => profile.id !== userId)
          .map((profile) => ({
            id: profile.id,
            name: firstName(profile.full_name),
          })),
      ];
      const usedNames = new Set(
        realActivePeople.map((person) => person.name.toLocaleLowerCase("pl")),
      );
      const additionalPeople = FAKE_NAMES.filter(
        (name) => !usedNames.has(name.toLocaleLowerCase("pl")),
      ).map((name) => ({
        id: `active-${name}`,
        name,
      }));

      setOnlineCount(nextOnlineCount);
      setActivePeople(
        [...realActivePeople, ...additionalPeople].slice(0, Math.min(10, nextOnlineCount)),
      );
      setLoading(false);
    },
    [userId],
  );

  useEffect(() => {
    load();
    const id = window.setInterval(() => load(true), 60000);
    const channel = supabase
      .channel("community-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () =>
        load(true),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, () =>
        load(true),
      )
      .subscribe();
    return () => {
      window.clearInterval(id);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const post = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    const needsModeration = category !== "general";
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      category,
      is_approved: !needsModeration || isAdmin,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setContent("");
    if (needsModeration && !isAdmin) {
      toast.success("Wysłane do moderacji. Pojawi się po akceptacji.");
    } else {
      toast.success("Opublikowano!");
    }
    await load(true);
  };

  const comment = async (postId: string) => {
    const text = commentInput[postId];
    if (!user || !text?.trim()) return;
    setCommentingPostId(postId);
    const { error } = await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });
    setCommentingPostId(null);
    if (error) return toast.error(error.message);
    setCommentInput((s) => ({ ...s, [postId]: "" }));
    setExpandedPosts((current) => new Set(current).add(postId));
    await load(true);
  };

  const removePost = async (id: string) => {
    if (!confirm("Usunąć wpis?")) return;
    await supabase.from("community_posts").delete().eq("id", id);
    await load(true);
  };

  const moderate = async (id: string, approve: boolean) => {
    if (approve) {
      await supabase.from("community_posts").update({ is_approved: true }).eq("id", id);
    } else {
      await supabase.from("community_posts").delete().eq("id", id);
    }
    await load(true);
  };

  const q = search.trim().toLowerCase();
  const visible = posts
    .filter((p) => {
      if (!p.is_approved && !isAdmin && p.user_id !== user?.id) return false;
      if (filter === "pending") return !p.is_approved;
      if (filter !== "all" && p.category !== filter) return false;
      if (q) {
        return (
          p.content.toLowerCase().includes(q) || (p.author_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .filter((p) => feedMode !== "unanswered" || (comments[p.id] ?? []).length === 0)
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      if (feedMode === "active") {
        const commentDiff = (comments[b.id] ?? []).length - (comments[a.id] ?? []).length;
        if (commentDiff !== 0) return commentDiff;
      }
      return db - da;
    });

  const pendingCount = posts.filter((p) => !p.is_approved).length;
  const approvedPosts = posts.filter((p) => p.is_approved);
  const totalComments = Object.values(comments).reduce((sum, rows) => sum + rows.length, 0);
  const unansweredPosts = approvedPosts.filter((p) => (comments[p.id] ?? []).length === 0);
  const toggleDiscussion = (postId: string) => {
    setExpandedPosts((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <PageShell
      title="Społeczność"
      subtitle="Pokaż postęp, poproś o pomoc i pomóż komuś zrobić kolejny krok."
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet via-violet to-blue p-5 text-white shadow-glow sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
              <Users className="h-7 w-7" />
              {onlineCount > 0 && (
                <span className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-green" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                Razem łatwiej dowozić
              </div>
              <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
                Co dziś budujesz?
              </h2>
              <p className="mt-1 max-w-xl text-sm text-white/80">
                Podziel się konkretem. Najlepsze rozmowy zaczynają się od prawdziwego problemu albo
                małego sukcesu.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur">
              <div className="text-xl font-extrabold">{onlineCount}</div>
              <div className="text-[10px] text-white/70">online teraz</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur">
              <div className="text-xl font-extrabold">{approvedPosts.length}</div>
              <div className="text-[10px] text-white/70">wątków</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur">
              <div className="text-xl font-extrabold">{totalComments}</div>
              <div className="text-[10px] text-white/70">odpowiedzi</div>
            </div>
          </div>
        </div>
        {activePeople.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
            <div className="flex -space-x-2">
              {activePeople.map((person) => (
                <div
                  key={person.id}
                  title={person.name}
                  className="grid h-8 w-8 place-items-center rounded-full border-2 border-violet bg-white/20 text-[9px] font-extrabold backdrop-blur"
                >
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/75">
              Aktywni: {activePeople.map((person) => person.name).join(", ")}
              {onlineCount > activePeople.length ? " [...]" : ""}
            </p>
          </div>
        )}
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 space-y-4">
          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-soft text-violet">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold">Rozpocznij rozmowę</h3>
                <p className="text-xs text-muted-foreground">
                  Nie wiesz, jak zacząć? Wybierz gotowy format.
                </p>
              </div>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {POST_STARTERS.map((starter) => {
                const Icon = starter.icon;
                return (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => setContent(starter.text)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold transition-colors hover:border-violet/40 hover:bg-violet-soft/40 hover:text-violet"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {starter.label}
                  </button>
                );
              })}
            </div>

            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Co u Ciebie? Pokaż postęp albo opisz miejsce, w którym utknąłeś..."
              className="min-h-[120px] resize-y rounded-2xl border-border bg-muted/20 text-sm"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Temat rozmowy
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCategory(item.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                          category === item.key
                            ? "bg-gradient-violet text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {category !== "general" && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    Ten temat wymaga akceptacji moderatora.
                  </p>
                )}
              </div>
              <Button
                onClick={post}
                disabled={posting || !content.trim()}
                className="rounded-xl bg-gradient-violet text-primary-foreground"
              >
                <Send className="mr-1.5 h-4 w-4" />
                {posting ? "Publikuję..." : "Opublikuj"}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Szukaj tematów lub osób..."
                  className="rounded-xl border-0 bg-muted/50 pl-9"
                />
              </div>
              <div className="flex rounded-xl bg-muted p-1">
                {[
                  { key: "newest" as const, label: "Najnowsze", icon: Clock },
                  { key: "active" as const, label: "Aktywne", icon: Flame },
                  {
                    key: "unanswered" as const,
                    label: `Bez odpowiedzi (${unansweredPosts.length})`,
                    icon: MessageSquare,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setFeedMode(mode.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-bold transition-all",
                        feedMode === mode.key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {(filter !== "all" || (isAdmin && pendingCount > 0)) && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="rounded-lg bg-violet-soft px-2.5 py-1 text-[11px] font-bold text-violet"
                  >
                    Wyczyść filtr: {CAT_MAP[filter]?.label ?? filter} ×
                  </button>
                )}
                {isAdmin && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
                    className="rounded-lg bg-orange/10 px-2.5 py-1 text-[11px] font-bold text-orange"
                  >
                    Do moderacji ({pendingCount})
                  </button>
                )}
              </div>
            )}
          </section>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-3xl border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <MessageSquare className="mx-auto h-9 w-9 text-violet" />
              <h3 className="mt-3 font-display text-lg font-extrabold">Tu jest jeszcze cicho</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Zmień filtr albo rozpocznij rozmowę. Konkretne pytanie zwykle dostaje najlepsze
                odpowiedzi.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => {
                  setFeedMode("newest");
                  setFilter("all");
                  setSearch("");
                }}
              >
                Pokaż wszystkie wpisy
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((postItem) => {
                const cat = CAT_MAP[postItem.category] ?? CATEGORIES[0];
                const CatIcon = cat.icon;
                const initials = (postItem.author_name ?? "U").slice(0, 2).toUpperCase();
                const postComments = comments[postItem.id] ?? [];
                const expanded = expandedPosts.has(postItem.id);
                const displayedComments = expanded ? postComments : postComments.slice(-2);

                return (
                  <article
                    id={`community-post-${postItem.id}`}
                    key={postItem.id}
                    className="group scroll-mt-24 rounded-3xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-xs font-extrabold text-white shadow-sm",
                            cat.gradient,
                          )}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold">
                            {postItem.author_name}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="inline-flex items-center gap-1 rounded-lg text-[10px]"
                            >
                              <CatIcon className="h-3 w-3" />
                              {cat.label}
                            </Badge>
                            {!postItem.is_example && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {relativeTime(postItem.created_at)}
                              </span>
                            )}
                            {!postItem.is_approved && (
                              <Badge
                                variant="outline"
                                className="border-orange/40 text-[10px] text-orange"
                              >
                                Oczekuje moderacji
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        {isAdmin && !postItem.is_approved && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-green"
                              onClick={() => moderate(postItem.id, true)}
                              aria-label="Akceptuj wpis"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive"
                              onClick={() => moderate(postItem.id, false)}
                              aria-label="Odrzuć wpis"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(user?.id === postItem.user_id || isAdmin) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-muted-foreground opacity-70 hover:text-destructive group-hover:opacity-100"
                            onClick={() => removePost(postItem.id)}
                            aria-label="Usuń wpis"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{postItem.content}</p>

                    {displayedComments.length > 0 && (
                      <div className="mt-4 space-y-2 rounded-2xl bg-muted/35 p-3">
                        {postComments.length > 2 && !expanded && (
                          <button
                            type="button"
                            onClick={() => toggleDiscussion(postItem.id)}
                            className="text-[11px] font-bold text-violet hover:underline"
                          >
                            Pokaż wszystkie odpowiedzi ({postComments.length})
                          </button>
                        )}
                        {displayedComments.map((commentItem) => {
                          const commentInitials = (commentItem.author_name ?? "U")
                            .slice(0, 2)
                            .toUpperCase();
                          return (
                            <div key={commentItem.id} className="flex items-start gap-2.5">
                              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background text-[9px] font-extrabold text-violet shadow-sm">
                                {commentInitials}
                              </div>
                              <div className="min-w-0 rounded-2xl rounded-tl-sm bg-background px-3 py-2 text-xs shadow-sm">
                                <div className="font-extrabold">{commentItem.author_name}</div>
                                <p className="mt-0.5 whitespace-pre-wrap leading-5">
                                  {commentItem.content}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => toggleDiscussion(postItem.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-violet-soft hover:text-violet"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {postComments.length === 0
                          ? "Napisz pierwszą odpowiedź"
                          : `${postComments.length} odpowiedzi`}
                        {expanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {postComments.length === 0 && postItem.is_approved && (
                        <span className="rounded-full bg-orange/10 px-2 py-1 text-[10px] font-bold text-orange">
                          Czeka na pomoc
                        </span>
                      )}
                    </div>

                    {expanded && postItem.is_approved && (
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          value={commentInput[postItem.id] ?? ""}
                          onChange={(event) =>
                            setCommentInput((current) => ({
                              ...current,
                              [postItem.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void comment(postItem.id);
                            }
                          }}
                          placeholder="Napisz pomocną odpowiedź..."
                          className="rounded-xl bg-muted/30 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => comment(postItem.id)}
                          disabled={
                            commentingPostId === postItem.id || !commentInput[postItem.id]?.trim()
                          }
                          className="h-9 rounded-xl bg-gradient-violet px-3"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-5">
          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-extrabold">Tematy</h3>
              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="text-[10px] font-bold text-violet hover:underline"
                >
                  Wyczyść
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {CATEGORIES.map((item) => {
                const Icon = item.icon;
                const count = approvedPosts.filter(
                  (postItem) => postItem.category === item.key,
                ).length;
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(active ? "all" : item.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-violet-soft text-violet" : "hover:bg-muted/60",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br text-white",
                        item.gradient,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 flex-1 text-xs font-extrabold">{item.label}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{count}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
