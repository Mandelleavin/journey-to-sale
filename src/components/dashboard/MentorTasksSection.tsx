import { useEffect, useState } from "react";
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
import { Sparkles, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MentorTask = {
  id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  due_date: string | null;
  status: "assigned" | "submitted" | "approved" | "rejected" | "needs_revision";
  admin_feedback: string | null;
  submission_content: string | null;
};

export function MentorTasksSection() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [active, setActive] = useState<MentorTask | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mentor_assigned_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTasks((data ?? []) as MentorTask[]);
  };

  useEffect(() => {
    load();
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

  const statusLabel = (s: MentorTask["status"]) =>
    ({
      assigned: { label: "Do zrobienia", tone: "border-blue/40 text-blue" },
      submitted: { label: "Wysłane", tone: "border-violet/40 text-violet" },
      approved: { label: "Zatwierdzone", tone: "border-green/40 text-green" },
      rejected: { label: "Odrzucone", tone: "border-destructive/40 text-destructive" },
      needs_revision: { label: "Do poprawy", tone: "border-orange/40 text-orange" },
    })[s];

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

      <div className="space-y-2">
        {tasks.map((t) => {
          const tag = statusLabel(t.status);
          const interactive = t.status === "assigned" || t.status === "needs_revision";
          return (
            <div
              key={t.id}
              className="rounded-2xl border border-border p-4 hover:border-violet/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{t.title}</div>
                  {t.instructions && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {t.instructions}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-bold text-violet">
                      <Zap className="w-3 h-3" />+{t.xp_reward} XP
                    </span>
                    {t.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.due_date).toLocaleDateString("pl-PL")}
                      </span>
                    )}
                  </div>
                </div>
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
              {t.admin_feedback && (t.status === "needs_revision" || t.status === "rejected") && (
                <div className="mt-2 text-xs rounded-lg bg-orange/10 border border-orange/30 p-2">
                  <b>Mentor:</b> {t.admin_feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
