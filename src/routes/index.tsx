import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatCards } from "@/components/dashboard/StatCards";
import { MissionCard } from "@/components/dashboard/MissionCard";
import { CoursesSection } from "@/components/dashboard/CoursesSection";
import { TasksAndAchievements } from "@/components/dashboard/TasksAndAchievements";
import { ProgressPath } from "@/components/dashboard/ProgressPath";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CreditsWidget } from "@/components/dashboard/CreditsWidget";
import { AccelerateWidget } from "@/components/dashboard/AccelerateWidget";
import { AdvisorButton } from "@/components/dashboard/AdvisorButton";
import { SubmitTaskDialog } from "@/components/dashboard/SubmitTaskDialog";
import { MentorTasksSection } from "@/components/dashboard/MentorTasksSection";
import { MobileTopNav } from "@/components/dashboard/MobileTopNav";
import { useAuth } from "@/lib/auth-context";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  component: Index,
});

type MentorTask = {
  id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  due_date: string | null;
  status: "assigned" | "submitted" | "approved" | "rejected" | "needs_revision";
};

function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const data = useDashboardData();
  const [fullName, setFullName] = useState<string | undefined>();
  const [hasSurvey, setHasSurvey] = useState<boolean | null>(null);
  const [readiness, setReadiness] = useState(0);
  const [profileCreated, setProfileCreated] = useState<string | null>(null);
  const [submitTaskId, setSubmitTaskId] = useState<string | null>(null);
  const [submitTaskTitle, setSubmitTaskTitle] = useState<string | undefined>();
  const [mentorTasks, setMentorTasks] = useState<MentorTask[]>([]);

  // Unauthenticated users see the landing page (no redirect)


  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: survey }, { data: mt }] = await Promise.all([
        supabase.from("profiles").select("full_name, created_at").eq("id", user.id).maybeSingle(),
        supabase
          .from("survey_responses")
          .select("id, readiness_percent")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("mentor_assigned_tasks")
          .select("id, title, instructions, xp_reward, due_date, status")
          .eq("user_id", user.id),
      ]);
      setFullName(prof?.full_name ?? undefined);
      setProfileCreated(prof?.created_at ?? null);
      setHasSurvey(!!survey);
      setReadiness(survey?.readiness_percent ?? 0);
      setMentorTasks((mt ?? []) as MentorTask[]);
    })();
  }, [user]);

  useEffect(() => {
    if (hasSurvey === false) navigate({ to: "/onboarding" });
  }, [hasSurvey, navigate]);

  // Bieżący dzień programu — taka sama logika jak na /path
  const currentDay = useMemo(() => {
    if (!profileCreated) return 1;
    const days = Math.floor((Date.now() - new Date(profileCreated).getTime()) / 86400000) + 1;
    return Math.max(1, Math.min(90, days));
  }, [profileCreated]);

  const today = new Date().toISOString().slice(0, 10);

  const mission = useMemo(() => {
    if (data.tasks.length === 0) return null;
    const completed = new Set(
      data.submissions.filter((s) => s.status === "approved").map((s) => s.task_id),
    );
    return data.tasks.find((t) => !completed.has(t.id)) ?? null;
  }, [data.tasks, data.submissions]);

  const courseTasksToday = useMemo(() => {
    const submissionsByTask = new Map(data.submissions.map((s) => [s.task_id, s] as const));
    const open = data.tasks.filter((t) => {
      const s = submissionsByTask.get(t.id);
      return !s || s.status === "rejected" || s.status === "needs_revision";
    });
    return open.slice(0, 3).map((t) => ({ ...t, sub: submissionsByTask.get(t.id) }));
  }, [data.tasks, data.submissions]);

  const mentorToday = useMemo(() => {
    return mentorTasks.filter((t) => {
      if (t.status !== "assigned" && t.status !== "needs_revision") return false;
      if (!t.due_date) return true;
      return t.due_date <= today;
    });
  }, [mentorTasks, today]);

  const enrichedCourses = useMemo(() => {
    return data.courses.slice(0, 4).map((c, i) => {
      const lessonsForCourse = data.lessons.filter((l) => l.course_id === c.id);
      const watched = lessonsForCourse.filter((l) => data.watchedLessonIds.has(l.id)).length;
      const progress = lessonsForCourse.length
        ? Math.round((watched / lessonsForCourse.length) * 100)
        : 0;
      const unlocked = data.totalXp >= c.required_xp;
      return {
        id: c.id,
        num: i + 1,
        title: c.title,
        progress,
        required_xp: c.required_xp,
        unlocked,
        done: progress === 100 && lessonsForCourse.length > 0,
        color: (["green", "blue", "violet", "orange"] as const)[i % 4],
      };
    });
  }, [data.courses, data.lessons, data.watchedLessonIds, data.totalXp]);

  const upcoming = useMemo(() => data.tasks.slice(0, 3).map((t) => t.title), [data.tasks]);

  const submitMentor = async (t: MentorTask) => {
    const txt = window.prompt(`Opisz wykonanie zadania:\n\n${t.title}`, "");
    if (!txt || txt.trim().length < 5) return;
    const { error } = await supabase
      .from("mentor_assigned_tasks")
      .update({
        submission_content: txt,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Wysłano do mentora");
      setMentorTasks((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, status: "submitted" } : x)),
      );
    }
  };

  if (authLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  const pathPct = Math.round(((currentDay - 1) / 89) * 100);

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex gap-6">
        <Sidebar />

        <main className="flex-1 min-w-0 space-y-5">
          <MobileTopNav />
          <TopBar fullName={fullName} notificationsCount={data.notificationsCount} />
          <StatCards
            level={data.level}
            totalXp={data.totalXp}
            xpToNext={data.xpToNext}
            pctToNext={Math.round(data.pctToNext)}
            pathDay={currentDay}
            pathPct={pathPct}
            successPct={readiness}
          />
          <ProgressPath currentDay={currentDay} />

          {/* Plan na dziś — taki sam jak w „Moja ścieżka" */}
          <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-violet grid place-items-center">
                  <Calendar className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-lg">Twój plan na dziś</h2>
                  <p className="text-xs text-muted-foreground">
                    Dzień {currentDay} z 90 — zadania ze ścieżki
                  </p>
                </div>
              </div>
              <Link to="/path" className="text-xs font-bold text-violet">
                Zobacz całą ścieżkę →
              </Link>
            </div>

            {mentorToday.length === 0 && courseTasksToday.length === 0 ? (
              <div className="text-sm text-muted-foreground p-6 text-center">
                🎉 Brak zaległych zadań. Świetna robota! Otwórz{" "}
                <Link to="/courses" className="text-violet font-bold">
                  Kursy
                </Link>
                , żeby ruszyć dalej.
              </div>
            ) : (
              <div className="space-y-3">
                {mentorToday.map((t) => (
                  <TaskRow
                    key={`m-${t.id}`}
                    badge="Mentor"
                    title={t.title}
                    instructions={t.instructions}
                    xp={t.xp_reward}
                    dueLabel={
                      t.due_date ? new Date(t.due_date).toLocaleDateString("pl-PL") : undefined
                    }
                    status={t.status === "needs_revision" ? "revise" : "todo"}
                    onAction={() => submitMentor(t)}
                    actionLabel={t.status === "needs_revision" ? "Popraw" : "Oznacz jako zrobione"}
                  />
                ))}
                {courseTasksToday.map((t) => (
                  <TaskRow
                    key={`c-${t.id}`}
                    badge="Kurs"
                    title={t.title}
                    instructions={t.instructions}
                    xp={t.xp_reward}
                    status={t.sub?.status === "needs_revision" ? "revise" : "todo"}
                    onAction={() => {
                      setSubmitTaskId(t.id);
                      setSubmitTaskTitle(t.title);
                    }}
                    actionLabel={
                      t.sub?.status === "needs_revision" ? "Popraw" : "Wyślij rozwiązanie"
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <MissionCard
            title={mission?.title}
            description={mission?.instructions ?? undefined}
            xpReward={mission?.xp_reward ?? 120}
            unlocked={!!mission}
            upcoming={upcoming}
            onAction={() => {
              if (mission) {
                setSubmitTaskId(mission.id);
                setSubmitTaskTitle(mission.title);
              }
            }}
          />
          <MentorTasksSection />
          <div className="grid lg:grid-cols-2 gap-5">
            <CreditsWidget />
            <AccelerateWidget />
          </div>
          <CoursesSection courses={enrichedCourses} fullName={fullName} />
          <TasksAndAchievements />
        </main>
      </div>

      <AdvisorButton />

      <SubmitTaskDialog
        taskId={submitTaskId}
        taskTitle={submitTaskTitle}
        open={!!submitTaskId}
        onOpenChange={(v) => {
          if (!v) {
            setSubmitTaskId(null);
            setSubmitTaskTitle(undefined);
          }
        }}
        onSubmitted={data.refresh}
      />
    </div>
  );
}

function TaskRow({
  badge,
  title,
  instructions,
  xp,
  dueLabel,
  status,
  onAction,
  actionLabel,
}: {
  badge: string;
  title: string;
  instructions: string | null;
  xp: number;
  dueLabel?: string;
  status: "todo" | "revise";
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4 hover:border-violet/40 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                badge === "Mentor" ? "bg-violet-soft text-violet" : "bg-blue-soft text-blue",
              )}
            >
              {badge}
            </span>
            {status === "revise" && (
              <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5 bg-orange-soft text-orange inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Do poprawy
              </span>
            )}
            {dueLabel && (
              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {dueLabel}
              </span>
            )}
          </div>
          <div className="font-bold text-sm mt-1">{title}</div>
          {instructions && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{instructions}</p>
          )}
          <div className="text-xs font-bold text-violet mt-2">+{xp} XP</div>
        </div>
        <Button
          size="sm"
          onClick={onAction}
          className="bg-gradient-violet text-primary-foreground h-8 text-xs"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
