import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, Zap, ChevronDown, History, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TaskStatus =
  | "assigned"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_revision";

type MentorTask = {
  id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  due_date: string | null;
  status: TaskStatus;
  admin_feedback: string | null;
  submission_content: string | null;
  created_at: string;
  updated_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
};

type FilterKey = "all" | "in_progress" | "assigned" | "approved";

export function MentorTasksSection() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [active, setActive] = useState<MentorTask | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const approvedIdsRef = useRef<Set<string> | null>(null);
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mentor_assigned_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const next = (data ?? []) as MentorTask[];

    // Detect newly approved tasks and notify with XP gained
    const prevApproved = approvedIdsRef.current;
    const currentApproved = new Set(
      next.filter((t) => t.status === "approved").map((t) => t.id),
    );
    if (prevApproved) {
      const weekAgo = Date.now() - 7 * 86400000;
      const newlyApprovedTasks = next.filter(
        (t) => t.status === "approved" && !prevApproved.has(t.id),
      );
      if (newlyApprovedTasks.length > 0) {
        const totalGained = newlyApprovedTasks.reduce(
          (s, t) => s + (t.xp_reward ?? 0),
          0,
        );
        const weekGained = newlyApprovedTasks
          .filter((t) => {
            const d = t.reviewed_at ?? t.updated_at;
            return d && new Date(d).getTime() >= weekAgo;
          })
          .reduce((s, t) => s + (t.xp_reward ?? 0), 0);
        const titles = newlyApprovedTasks.map((t) => t.title).join(", ");
        toast.success(`🏆 Zadanie zatwierdzone: +${totalGained} XP`, {
          description:
            `${titles}` +
            (weekGained > 0
              ? ` · W tym tygodniu: +${weekGained} XP · Łącznie zdobyte: +${totalGained} XP`
              : ` · Łącznie zdobyte: +${totalGained} XP`),
          icon: <Trophy className="w-4 h-4 text-green" />,
          duration: 7000,
        });
      }
    }
    approvedIdsRef.current = currentApproved;
    setTasks(next);
  };

  useEffect(() => {
    load();
  }, [user]);

  // Realtime: nasłuchuj zmian zadań i odśwież (co wyzwoli toast jeśli pojawi się nowe zatwierdzenie)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`mentor-tasks-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mentor_assigned_tasks",
          filter: `user_id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const open = (t: MentorTask) => {
    setActive(t);
    setContent(t.submission_content ?? "");
  };

  const submit = async () => {
    if (!active || content.trim().length < 10) return toast.error("Min. 10 znaków");
    setSubmitting(true);
    const { error } = await supabase
      .from("mentor_assigned_tasks")
      .update({
        submission_content: content,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", active.id);
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Wysłano do mentora");
      setActive(null);
      load();
    }
  };

  if (tasks.length === 0) return null;

  const statusLabel = (s: MentorTask["status"]) => {
    const map = {
      assigned: { label: "Do zrobienia", tone: "border-blue/40 text-blue" },
      in_progress: { label: "W trakcie", tone: "border-violet/40 text-violet" },
      submitted: { label: "Wysłane", tone: "border-violet/40 text-violet" },
      approved: { label: "Zatwierdzone", tone: "border-green/40 text-green" },
      rejected: { label: "Odrzucone", tone: "border-destructive/40 text-destructive" },
      needs_revision: { label: "Do poprawy", tone: "border-orange/40 text-orange" },
    } as Record<string, { label: string; tone: string }>;
    return map[s] ?? { label: s ?? "—", tone: "border-border text-muted-foreground" };
  };

  return (
    <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-violet grid place-items-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-lg">Zadania od mentora</h2>
          <p className="text-xs text-muted-foreground">
            Spersonalizowane zadania przypisane bezpośrednio dla Ciebie
          </p>
        </div>
      </div>

      {(() => {
        const counts = {
          all: tasks.length,
          in_progress: tasks.filter((t) => t.status === "in_progress").length,
          assigned: tasks.filter((t) => t.status === "assigned" || t.status === "needs_revision")
            .length,
          approved: tasks.filter((t) => t.status === "approved").length,
        };
        const filters: { key: FilterKey; label: string }[] = [
          { key: "all", label: "Wszystkie" },
          { key: "in_progress", label: "W trakcie" },
          { key: "assigned", label: "Do zrobienia" },
          { key: "approved", label: "Zatwierdzone" },
        ];
        return (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors",
                  filter === f.key
                    ? "bg-gradient-violet text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {f.label} · {counts[f.key]}
              </button>
            ))}
          </div>
        );
      })()}

      <div className="space-y-2">
        {(() => {
          const filtered = tasks.filter((t) => {
            if (filter === "all") return true;
            if (filter === "assigned")
              return t.status === "assigned" || t.status === "needs_revision";
            return t.status === filter;
          });
          if (filtered.length === 0) {
            return (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Brak zadań w tej kategorii
              </div>
            );
          }
          return filtered.map((t) => {
          const tag = statusLabel(t.status);
          const interactive = t.status === "assigned" || t.status === "needs_revision";
          const isExpanded = expanded.has(t.id);
          const fmt = (d: string | null) =>
            d ? new Date(d).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : null;
          const history: { label: string; date: string | null; tone: string }[] = [
            { label: "Przypisano przez mentora", date: fmt(t.created_at), tone: "bg-blue" },
            t.submitted_at
              ? { label: "Wysłano do recenzji", date: fmt(t.submitted_at), tone: "bg-violet" }
              : null,
            t.reviewed_at
              ? {
                  label:
                    t.status === "approved"
                      ? "Zatwierdzone przez mentora"
                      : t.status === "rejected"
                        ? "Odrzucone przez mentora"
                        : t.status === "needs_revision"
                          ? "Zwrócone do poprawy"
                          : "Zrecenzowane",
                  date: fmt(t.reviewed_at),
                  tone:
                    t.status === "approved"
                      ? "bg-green"
                      : t.status === "rejected"
                        ? "bg-destructive"
                        : "bg-orange",
                }
              : null,
          ].filter(Boolean) as { label: string; date: string | null; tone: string }[];
          return (
            <div
              key={t.id}
              className="rounded-2xl border border-border p-4 hover:border-violet/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleExpand(t.id)}
                  className="flex-1 min-w-0 text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                    <div className="font-bold text-sm">{t.title}</div>
                  </div>
                  {t.instructions && !isExpanded && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pl-6">
                      {t.instructions}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground pl-6 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-bold text-violet">
                      <Zap className="w-3 h-3" />+{t.xp_reward} XP
                    </span>
                    {t.due_date && (() => {
                      const due = new Date(t.due_date);
                      const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
                      const overdue = days < 0;
                      const today = days === 0;
                      const soon = days > 0 && days <= 3;
                      const label = overdue
                        ? `po terminie (${Math.abs(days)} dni)`
                        : today
                          ? "dziś!"
                          : days === 1
                            ? "jutro"
                            : `za ${days} dni`;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md",
                            overdue
                              ? "bg-destructive/10 text-destructive"
                              : today
                                ? "bg-orange-soft text-orange"
                                : soon
                                  ? "bg-yellow-note/40 text-foreground"
                                  : "text-muted-foreground",
                          )}
                          title={`Termin: ${due.toLocaleDateString("pl-PL")}`}
                        >
                          <Calendar className="w-3 h-3" />
                          {due.toLocaleDateString("pl-PL")} · {label}
                        </span>
                      );
                    })()}
                  </div>
                </button>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", tag.tone)}>
                    {tag.label}
                  </Badge>
                  {interactive && (
                    <Button
                      size="sm"
                      onClick={() => open(t)}
                      className="bg-gradient-violet text-primary-foreground h-7 text-xs"
                    >
                      {t.status === "needs_revision" ? "Popraw" : "Wykonaj"}
                    </Button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pl-6 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {t.instructions && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Instrukcje mentora
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {t.instructions}
                      </p>
                    </div>
                  )}
                  {t.admin_feedback && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Feedback mentora
                      </div>
                      <p className="text-sm rounded-lg bg-orange/10 border border-orange/30 p-2 whitespace-pre-wrap">
                        {t.admin_feedback}
                      </p>
                    </div>
                  )}
                  {t.submission_content && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Twoje rozwiązanie
                      </div>
                      <p className="text-sm rounded-lg bg-muted p-2 whitespace-pre-wrap">
                        {t.submission_content}
                      </p>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2 inline-flex items-center gap-1">
                      <History className="w-3 h-3" /> Historia statusu
                    </div>
                    <ol className="relative border-l border-border pl-4 space-y-2">
                      {history.map((h, i) => (
                        <li key={i} className="text-xs">
                          <span
                            className={cn(
                              "absolute -left-[5px] w-2.5 h-2.5 rounded-full",
                              h.tone,
                            )}
                          />
                          <div className="font-semibold text-foreground">{h.label}</div>
                          {h.date && (
                            <div className="text-muted-foreground">{h.date}</div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {!isExpanded &&
                t.admin_feedback &&
                (t.status === "needs_revision" || t.status === "rejected") && (
                  <div className="mt-2 text-xs rounded-lg bg-orange/10 border border-orange/30 p-2 ml-6">
                    <b>Mentor:</b> {t.admin_feedback}
                  </div>
                )}
            </div>
          );
          });
        })()}
      </div>

      {(() => {
        const isOpen = (s: TaskStatus) =>
          s === "assigned" || s === "in_progress" || s === "needs_revision";
        const now = Date.now();
        const weekEnd = now + 7 * 86400000;
        const totalXp = tasks
          .filter((t) => isOpen(t.status))
          .reduce((sum, t) => sum + (t.xp_reward ?? 0), 0);
        const weekXp = tasks
          .filter(
            (t) =>
              isOpen(t.status) &&
              t.due_date &&
              new Date(t.due_date).getTime() <= weekEnd,
          )
          .reduce((sum, t) => sum + (t.xp_reward ?? 0), 0);
        const earnedXp = tasks
          .filter((t) => t.status === "approved")
          .reduce((sum, t) => sum + (t.xp_reward ?? 0), 0);
        return (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-yellow-note/40 to-orange-soft p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                W tym tygodniu
              </div>
              <div className="font-display font-extrabold text-orange text-xl leading-tight mt-0.5 inline-flex items-center gap-1">
                <Zap className="w-4 h-4 fill-orange" />+{weekXp}
                <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">XP</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Do zdobycia
              </div>
              <div className="font-display font-extrabold text-violet text-xl leading-tight mt-0.5 inline-flex items-center gap-1">
                <Zap className="w-4 h-4 fill-violet" />+{totalXp}
                <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">XP</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-green-soft to-blue-soft p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Zdobyte
              </div>
              <div className="font-display font-extrabold text-green text-xl leading-tight mt-0.5 inline-flex items-center gap-1">
                <Zap className="w-4 h-4 fill-green" />+{earnedXp}
                <span className="text-[10px] font-semibold text-muted-foreground ml-0.5">XP</span>
              </div>
            </div>
          </div>
        );
      })()}

      <Dialog open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {active?.instructions && (
            <p className="text-sm text-muted-foreground">{active.instructions}</p>
          )}
          <Textarea
            placeholder="Opisz wykonanie zadania, wklej linki, dołącz wnioski..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Anuluj
            </Button>
            <Button
              onClick={submit}
              disabled={submitting}
              className="bg-gradient-violet text-primary-foreground"
            >
              {submitting ? "Wysyłanie..." : "Wyślij do mentora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
