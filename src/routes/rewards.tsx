import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trophy, Gift, Sparkles, Download, ExternalLink, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Nagrody — 90 Dni" },
      {
        name: "description",
        content: "Wymieniaj zdobyte XP na realne nagrody — szablony, prompty AI, zeszyty ćwiczeń.",
      },
    ],
  }),
  component: RewardsPage,
});

type Reward = {
  id: string;
  title: string;
  description: string | null;
  xp_cost: number;
  is_available: boolean;
  payload_url: string | null;
  payload_content: string | null;
  course_id: string | null;
};

type Claim = {
  id: string;
  reward_id: string;
  xp_spent: number;
  status: string;
  claimed_at: string;
};

type Course = { id: string; title: string; is_free: boolean };
type Lesson = { id: string; course_id: string };
type LessonTask = { id: string; lesson_id: string };
type XpRow = { amount: number; related_lesson_id: string | null; related_task_id: string | null };

function RewardsPage() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonTasks, setLessonTasks] = useState<LessonTask[]>([]);
  const [xpRows, setXpRows] = useState<XpRow[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Reward | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: r }, { data: c }, { data: cs }, { data: ls }, { data: lts }, { data: xp }] =
      await Promise.all([
        supabase.from("rewards").select("*").eq("is_available", true).order("position"),
        supabase
          .from("user_rewards")
          .select("*")
          .eq("user_id", user.id)
          .order("claimed_at", { ascending: false }),
        supabase.from("courses").select("id, title, is_free").order("position"),
        supabase.from("lessons").select("id, course_id"),
        supabase.from("lesson_tasks").select("id, lesson_id"),
        supabase
          .from("user_xp_log")
          .select("amount, related_lesson_id, related_task_id")
          .eq("user_id", user.id),
      ]);
    setRewards((r ?? []) as Reward[]);
    setClaims((c ?? []) as Claim[]);
    setCourses((cs ?? []) as Course[]);
    setLessons((ls ?? []) as Lesson[]);
    setLessonTasks((lts ?? []) as LessonTask[]);
    const xpData = (xp ?? []) as XpRow[];
    setXpRows(xpData);
    setTotalXp(xpData.reduce((s, r) => s + (r.amount ?? 0), 0));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  // Mapy dla obliczania XP per kurs
  const lessonToCourse = useMemo(() => {
    const m = new Map<string, string>();
    lessons.forEach((l) => m.set(l.id, l.course_id));
    return m;
  }, [lessons]);
  const taskToCourse = useMemo(() => {
    const m = new Map<string, string>();
    lessonTasks.forEach((t) => {
      const cid = lessonToCourse.get(t.lesson_id);
      if (cid) m.set(t.id, cid);
    });
    return m;
  }, [lessonTasks, lessonToCourse]);

  // XP zdobyte per kurs
  const xpEarnedByCourse = useMemo(() => {
    const m = new Map<string, number>();
    xpRows.forEach((row) => {
      const cid =
        (row.related_lesson_id && lessonToCourse.get(row.related_lesson_id)) ||
        (row.related_task_id && taskToCourse.get(row.related_task_id)) ||
        null;
      if (cid) m.set(cid, (m.get(cid) ?? 0) + (row.amount ?? 0));
    });
    return m;
  }, [xpRows, lessonToCourse, taskToCourse]);

  // XP wydane na nagrody per kurs
  const xpSpentByCourse = useMemo(() => {
    const m = new Map<string, number>();
    claims.forEach((cl) => {
      const reward = rewards.find((r) => r.id === cl.reward_id);
      if (reward?.course_id) {
        m.set(reward.course_id, (m.get(reward.course_id) ?? 0) + cl.xp_spent);
      }
    });
    return m;
  }, [claims, rewards]);

  const courseAvailableXp = (cid: string) =>
    Math.max(0, (xpEarnedByCourse.get(cid) ?? 0) - (xpSpentByCourse.get(cid) ?? 0));

  // XP wydane globalnie
  const globalSpent = useMemo(() => {
    return claims.reduce((s, cl) => {
      const reward = rewards.find((r) => r.id === cl.reward_id);
      return reward?.course_id ? s : s + cl.xp_spent;
    }, 0);
  }, [claims, rewards]);
  const globalAvailable = Math.max(0, totalXp - globalSpent);

  const claim = async (reward: Reward) => {
    if (!user) return;
    const available = reward.course_id
      ? courseAvailableXp(reward.course_id)
      : globalAvailable;
    if (available < reward.xp_cost) {
      return toast.error(
        reward.course_id
          ? "Za mało XP w tym kursie"
          : "Za mało XP",
      );
    }
    if (!confirm(`Odebrać "${reward.title}" za ${reward.xp_cost} XP?`)) return;
    const { error } = await supabase.from("user_rewards").insert({
      user_id: user.id,
      reward_id: reward.id,
      xp_spent: reward.xp_cost,
      status: "delivered",
    });
    if (error) return toast.error(error.message);
    toast.success("Nagroda odebrana! Materiały są dostępne poniżej.");
    setOpen(reward);
    load();
  };

  const claimedIds = new Set(claims.map((c) => c.reward_id));

  // Grupowanie nagród
  const globalRewards = rewards.filter((r) => !r.course_id);
  const rewardsByCourse = new Map<string, Reward[]>();
  rewards.forEach((r) => {
    if (r.course_id) {
      const arr = rewardsByCourse.get(r.course_id) ?? [];
      arr.push(r);
      rewardsByCourse.set(r.course_id, arr);
    }
  });

  const renderReward = (r: Reward, available: number) => {
    const owned = claimedIds.has(r.id);
    const canAfford = available >= r.xp_cost;
    return (
      <div
        key={r.id}
        className="rounded-2xl border border-border p-4 flex flex-col gap-2 hover:border-violet/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Gift className="w-4 h-4 text-violet" /> {r.title}
          </h3>
          <Badge variant="outline" className="border-violet/40 text-violet">
            {r.xp_cost} XP
          </Badge>
        </div>
        {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
        {owned ? (
          <Button
            size="sm"
            onClick={() => setOpen(r)}
            variant="outline"
            className="mt-auto border-green text-green"
          >
            <Download className="w-4 h-4 mr-1" /> Pobierz / otwórz
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => claim(r)}
            disabled={!canAfford}
            className="mt-auto bg-gradient-violet text-primary-foreground"
          >
            {canAfford ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" /> Odbierz
              </>
            ) : (
              `Brakuje ${r.xp_cost - available} XP`
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <PageShell title="Nagrody" subtitle={`Masz ${globalAvailable} XP do wydania na nagrody globalne. Nagrody w kursach opłacasz XP zdobytym w danym kursie.`}>
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase">
              Twoje XP (łącznie)
            </div>
            <div className="font-display font-extrabold text-3xl">{totalXp}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
        </div>
      ) : (
        <>
          {/* Sekcje nagród per kurs */}
          {courses
            .filter((c) => (rewardsByCourse.get(c.id) ?? []).length > 0)
            .map((c) => {
              const list = rewardsByCourse.get(c.id) ?? [];
              const earned = xpEarnedByCourse.get(c.id) ?? 0;
              const available = courseAvailableXp(c.id);
              return (
                <div
                  key={c.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div>
                      <h2 className="font-display font-bold text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet" /> Nagrody z kursu: {c.title}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Opłacane XP zdobytym w tym kursie.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">
                        XP w kursie
                      </div>
                      <div className="font-display font-extrabold text-xl text-violet">
                        {available}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          / {earned} zdobyte
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {list.map((r) => renderReward(r, available))}
                  </div>
                </div>
              );
            })}

          {/* Globalne nagrody */}
          {globalRewards.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display font-bold text-lg mb-4">Nagrody globalne</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {globalRewards.map((r) => renderReward(r, globalAvailable))}
              </div>
            </div>
          )}

          {rewards.length === 0 && (
            <div className="rounded-3xl border border-border bg-card p-8 shadow-soft text-center text-sm text-muted-foreground">
              Brak nagród
            </div>
          )}
        </>
      )}

      {claims.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Historia odebranych nagród</h2>
            <div className="text-xs text-muted-foreground">
              Łącznie: <span className="font-bold text-foreground">{claims.length}</span> · Wydane
              XP:{" "}
              <span className="font-bold text-foreground">
                {claims.reduce((s, c) => s + c.xp_spent, 0)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {claims.map((c) => {
              const reward = rewards.find((r) => r.id === c.reward_id);
              const courseName = reward?.course_id
                ? courses.find((co) => co.id === reward.course_id)?.title
                : null;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-soft grid place-items-center">
                      <Gift className="w-4 h-4 text-violet" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{reward?.title ?? "Nagroda"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.claimed_at).toLocaleString("pl-PL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · −{c.xp_spent} XP
                        {courseName && <> · kurs: {courseName}</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        c.status === "delivered"
                          ? "border-green/40 text-green"
                          : "border-violet/40 text-violet"
                      }
                    >
                      {c.status === "delivered" ? "Dostarczone" : c.status}
                    </Badge>
                    {reward && (
                      <Button size="sm" variant="outline" onClick={() => setOpen(reward)}>
                        <Download className="w-4 h-4 mr-1" /> Otwórz
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {open?.description && (
              <p className="text-sm text-muted-foreground">{open.description}</p>
            )}
            {open?.payload_url && (
              <a
                href={open.payload_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-violet text-primary-foreground text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" /> Otwórz materiał
              </a>
            )}
            {open?.payload_content && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                {open.payload_content}
              </div>
            )}
            {!open?.payload_url && !open?.payload_content && (
              <p className="text-sm text-muted-foreground">
                Materiał wkrótce. Skontaktujemy się z Tobą mailem.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(null)} variant="outline">
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
