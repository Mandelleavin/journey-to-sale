import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { MessageSquare, Trash2, Send } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Społeczność — 90 Dni" },
      { name: "description", content: "Dziel się postępami, pytaj, pomagaj innym uczestnikom." },
    ],
  }),
  component: CommunityPage,
});

type Post = {
  id: string;
  user_id: string;
  content: string;
  category: string;
  created_at: string;
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
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }, { data: prof }] = await Promise.all([
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("community_comments").select("*").order("created_at"),
      supabase.from("profiles").select("id, full_name"),
    ]);
    const nameMap = new Map((prof ?? []).map((x) => [x.id, x.full_name]));
    const enrichedPosts = ((p ?? []) as Post[]).map((x) => ({ ...x, author_name: nameMap.get(x.user_id) ?? "Użytkownik" }));
    const grouped: Record<string, Comment[]> = {};
    ((c ?? []) as Comment[]).forEach((cm) => {
      const enriched = { ...cm, author_name: nameMap.get(cm.user_id) ?? "Użytkownik" };
      (grouped[cm.post_id] ??= []).push(enriched);
    });
    setPosts(enrichedPosts);
    setComments(grouped);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const post = async () => {
    if (!user || !content.trim()) return;
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content,
      category,
    });
    if (error) return toast.error(error.message);
    setContent("");
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

  const visible = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  return (
    <PageShell title="Społeczność" subtitle="Dziel się sukcesami, pytaj, pomagaj innym.">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Co u Ciebie? Podziel się postępem lub zapytaj o radę..."
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Ogólne</SelectItem>
                <SelectItem value="success">Sukces 🎉</SelectItem>
                <SelectItem value="question">Pytanie</SelectItem>
                <SelectItem value="help">Szukam pomocy</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={post} className="bg-gradient-violet text-primary-foreground">
              <Send className="w-4 h-4 mr-1" /> Opublikuj
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {[
          ["all", "Wszystko"],
          ["general", "Ogólne"],
          ["success", "Sukces"],
          ["question", "Pytania"],
          ["help", "Pomoc"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
              filter === k ? "bg-gradient-violet text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Brak wpisów. Bądź pierwszy!
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-bold text-sm">{p.author_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("pl-PL")} · <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                  </div>
                </div>
                {user?.id === p.user_id && (
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removePost(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{p.content}</p>

              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {(comments[p.id] ?? []).map((c) => (
                  <div key={c.id} className="text-xs rounded-lg bg-muted/40 p-2">
                    <b>{c.author_name}:</b> {c.content}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Textarea
                    value={commentInput[p.id] ?? ""}
                    onChange={(e) => setCommentInput((s) => ({ ...s, [p.id]: e.target.value }))}
                    placeholder="Dodaj komentarz..."
                    className="min-h-[40px] text-xs"
                  />
                  <Button size="sm" onClick={() => comment(p.id)} variant="outline">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
