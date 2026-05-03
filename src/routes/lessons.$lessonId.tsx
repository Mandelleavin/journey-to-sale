import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
  Paperclip,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import { SubmitTaskDialog } from "@/components/dashboard/SubmitTaskDialog";
import { LessonVideoPlayer } from "@/components/lessons/LessonVideoPlayer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/components/admin/ContentBlocksEditor";

export const Route = createFileRoute("/lessons/$lessonId")({
  component: LessonPage,
});

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  content_blocks: ContentBlock[];
  xp_reward: number;
  course_id: string;
  module_id: string | null;
};
type Task = {
  id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  is_required: boolean;
};
type Sub = { id: string; task_id: string; status: string };
type Comment = {
  id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_admin_reply: boolean;
  created_at: string;
  author_name?: string;
};

function LessonPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Sub[]>([]);
  const [attachments, setAttachments] = useState<
    { id: string; title: string; file_url: string; file_type: string | null }[]
  >([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [watched, setWatched] = useState(false);
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    const [{ data: l }, { data: t }, { data: s }, { data: prog }, { data: a }, { data: c }] =
      await Promise.all([
        supabase
          .from("lessons")
          .select(
            "id, title, description, video_url, content, content_blocks, xp_reward, course_id, module_id",
          )
          .eq("id", lessonId)
          .maybeSingle(),
        supabase
          .from("lesson_tasks")
          .select("id, title, instructions, xp_reward, is_required")
          .eq("lesson_id", lessonId),
        supabase.from("task_submissions").select("id, task_id, status").eq("user_id", user.id),
        supabase
          .from("user_lesson_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .maybeSingle(),
        supabase
          .from("lesson_attachments")
          .select("id, title, file_url, file_type")
          .eq("lesson_id", lessonId)
          .order("position"),
        supabase
          .from("lesson_comments")
          .select("id, user_id, parent_id, content, is_admin_reply, created_at")
          .eq("lesson_id", lessonId)
          .order("created_at"),
      ]);
    if (l) {
      const row = l as Record<string, unknown>;
      setLesson({
        ...(row as unknown as Lesson),
        content_blocks: Array.isArray(row.content_blocks)
          ? (row.content_blocks as ContentBlock[])
          : [],
      });
    }
    setTasks((t ?? []) as Task[]);
    setSubmissions((s ?? []) as Sub[]);
    setWatched(!!prog);
    setAttachments((a ?? []) as never);

    // pobierz nazwy autorów komentarzy
    const cmts = (c ?? []) as Comment[];
    const uniqueIds = [...new Set(cmts.map((x) => x.user_id))];
    if (uniqueIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uniqueIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p.full_name as string]));
      setComments(cmts.map((c) => ({ ...c, author_name: map.get(c.user_id) ?? "Użytkownik" })));
    } else {
      setComments(cmts);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [user, lessonId]);

  // znajdź następną lekcję w kursie
  useEffect(() => {
    if (!lesson) return;
    (async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, position")
        .eq("course_id", lesson.course_id)
        .eq("is_published", true)
        .order("position");
      const list = (data ?? []) as { id: string; position: number }[];
      const idx = list.findIndex((x) => x.id === lesson.id);
      setNextLessonId(idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null);
      setPrevLessonId(idx > 0 ? list[idx - 1].id : null);
    })();
  }, [lesson]);

  const markWatched = useCallback(async () => {
    if (!user || watched) return;
    const { error } = await supabase
      .from("user_lesson_progress")
      .insert({ user_id: user.id, lesson_id: lessonId });
    if (error) {
      // 23505 = duplikat (już oznaczona) — ignoruj cicho
      if (!error.message.toLowerCase().includes("duplicate")) toast.error(error.message);
      setWatched(true);
    } else {
      toast.success(`+${lesson?.xp_reward ?? 0} XP! Lekcja ukończona`);
      setWatched(true);
    }
  }, [user, watched, lessonId, lesson?.xp_reward]);

  const addComment = async () => {
    if (!user || !newComment.trim()) return;
    const { error } = await supabase
      .from("lesson_comments")
      .insert({ lesson_id: lessonId, user_id: user.id, content: newComment.trim() });
    if (error) toast.error(error.message);
    else {
      setNewComment("");
      toast.success("Dodano");
      load();
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Usunąć komentarz?")) return;
    await supabase.from("lesson_comments").delete().eq("id", id);
    load();
  };

  if (!lesson)
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">
        Ładowanie...
      </div>
    );

  const subForTask = (taskId: string) => submissions.find((s) => s.task_id === taskId);

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <Link
          to="/courses/$courseId"
          params={{ courseId: lesson.course_id }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Powrót do kursu
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-2">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
        )}

        {/* Główne wideo z auto-detekcją ukończenia */}
        {lesson.video_url && (
          <LessonVideoPlayer videoUrl={lesson.video_url} onCompleted={markWatched} />
        )}

        {/* Bloki treści */}
        {lesson.content_blocks.length > 0 && (
          <div className="mt-6 space-y-4">
            {lesson.content_blocks.map((b) => (
              <BlockView key={b.id} block={b} />
            ))}
          </div>
        )}

        {/* Status / Mark watched + następna lekcja */}
        {/* Nawigacja prev/next w obrębie kursu */}
        <div className="mt-6 flex items-center justify-between gap-2">
          {prevLessonId ? (
            <Link
              to="/lessons/$lessonId"
              params={{ lessonId: prevLessonId }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold hover:border-violet/40"
            >
              <ArrowLeft className="w-4 h-4" /> Poprzednia
            </Link>
          ) : (
            <span />
          )}
          {nextLessonId ? (
            <Link
              to="/lessons/$lessonId"
              params={{ lessonId: nextLessonId }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold hover:border-violet/40"
            >
              Następna <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Status / Mark watched + następna lekcja */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={markWatched}
            disabled={watched}
            className="rounded-xl bg-gradient-green text-primary-foreground"
          >
            {watched ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Lekcja ukończona (+{lesson.xp_reward} XP)
              </>
            ) : (
              <>Oznacz jako ukończoną (+{lesson.xp_reward} XP)</>
            )}
          </Button>
          {watched && nextLessonId && (
            <Button
              onClick={() => navigate({ to: "/lessons/$lessonId", params: { lessonId: nextLessonId } })}
              variant="outline"
              className="rounded-xl"
            >
              Następna lekcja <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {watched && !nextLessonId && (
            <Link
              to="/courses/$courseId"
              params={{ courseId: lesson.course_id }}
              className="text-sm font-bold text-violet hover:underline"
            >
              Wróć do kursu →
            </Link>
          )}
        </div>

        {/* Załączniki */}
        {attachments.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Materiały do pobrania
            </h2>
            <div className="space-y-2">
              {attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-violet/40"
                >
                  <Paperclip className="w-4 h-4 text-violet shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{a.title}</div>
                    {a.file_type && (
                      <div className="text-xs text-muted-foreground">{a.file_type}</div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-violet">Pobierz →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Zadania */}
        <div className="mt-8">
          <h2 className="font-display font-bold text-lg mb-3">Zadania do wykonania</h2>
          {tasks.length === 0 && (
            <div className="text-sm text-muted-foreground">Brak zadań w tej lekcji</div>
          )}
          <div className="space-y-3">
            {tasks.map((t) => {
              const sub = subForTask(t.id);
              return (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="font-bold flex items-center gap-2 flex-wrap">
                        {t.title}
                        {t.is_required && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-soft text-orange">
                            wymagane
                          </span>
                        )}
                      </div>
                      {t.instructions && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {t.instructions}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-violet flex items-center gap-1 shrink-0">
                      <Zap className="w-3 h-3 fill-violet" />+{t.xp_reward} XP
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {sub ? (
                      <span className="text-xs font-bold uppercase">
                        Status:{" "}
                        <span
                          className={cn(
                            sub.status === "approved" && "text-green",
                            sub.status === "rejected" && "text-destructive",
                            sub.status === "needs_revision" && "text-orange",
                            sub.status === "pending" && "text-blue",
                          )}
                        >
                          {sub.status}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nie wysłano</span>
                    )}
                    {(!sub || sub.status === "needs_revision" || sub.status === "rejected") && (
                      <Button
                        size="sm"
                        onClick={() => setSubmitTask(t)}
                        className="bg-gradient-violet text-primary-foreground"
                      >
                        {sub ? "Wyślij ponownie" : "Wyślij rozwiązanie"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Komentarze */}
        <div className="mt-8">
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Pytania i komentarze ({comments.length})
          </h2>
          <div className="rounded-2xl border border-border bg-card p-3 mb-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Zadaj pytanie lub podziel się przemyśleniem..."
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={addComment}
                disabled={!newComment.trim()}
                className="bg-gradient-violet text-primary-foreground"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Wyślij
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {comments.length === 0 && (
              <div className="text-sm text-muted-foreground italic text-center py-4">
                Bądź pierwszy — zadaj pytanie pod tą lekcją.
              </div>
            )}
            {comments.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "rounded-xl border p-3",
                  c.is_admin_reply ? "border-violet/40 bg-violet-soft/20" : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold flex items-center gap-2">
                    {c.author_name}
                    {c.is_admin_reply && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet text-primary-foreground">
                        mentor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {c.user_id === user?.id && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-destructive hover:opacity-70"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm whitespace-pre-wrap">{c.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SubmitTaskDialog
        taskId={submitTask?.id ?? null}
        taskTitle={submitTask?.title}
        open={!!submitTask}
        onOpenChange={(v) => !v && setSubmitTask(null)}
        onSubmitted={load}
      />
    </div>
  );
}

function BlockView({ block }: { block: ContentBlock }) {
  if (block.type === "video") {
    const ytId = block.url?.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?]+)/,
    )?.[1];
    return (
      <div>
        {block.title && <div className="font-display font-bold mb-2">{block.title}</div>}
        {ytId ? (
          <div className="aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${ytId}`}
              allowFullScreen
            />
          </div>
        ) : block.url ? (
          <video src={block.url} controls className="w-full rounded-2xl bg-black" />
        ) : null}
      </div>
    );
  }
  if (block.type === "richtext") {
    return (
      <div
        className="prose prose-sm max-w-none [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h3]:font-display [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-violet [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-violet [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    );
  }
  if (block.type === "text") {
    return <div className="text-sm whitespace-pre-wrap">{block.text}</div>;
  }
  if (block.type === "file") {
    return (
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card p-3 hover:border-violet/40"
      >
        <Paperclip className="w-4 h-4 text-violet" />
        <span className="font-bold text-sm">{block.title || "Plik"}</span>
      </a>
    );
  }
  return null;
}
