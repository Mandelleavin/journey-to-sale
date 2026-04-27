import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatCards } from "@/components/dashboard/StatCards";
import { MissionCard } from "@/components/dashboard/MissionCard";
import { CoursesSection } from "@/components/dashboard/CoursesSection";
import { TasksAndAchievements } from "@/components/dashboard/TasksAndAchievements";
import { ProgressPath } from "@/components/dashboard/ProgressPath";
import { AdvisorButton } from "@/components/dashboard/AdvisorButton";
import { SubmitTaskDialog } from "@/components/dashboard/SubmitTaskDialog";
import { useAuth } from "@/lib/auth-context";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const data = useDashboardData();
  const [fullName, setFullName] = useState<string | undefined>();
  const [hasSurvey, setHasSurvey] = useState<boolean | null>(null);
  const [submitTaskId, setSubmitTaskId] = useState<string | null>(null);

  // Guard: niezalogowany -> /auth
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  // Sprawdź ankietę i pobierz profil
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: survey }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("survey_responses").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      setFullName(prof?.full_name ?? undefined);
      setHasSurvey(!!survey);
    })();
  }, [user]);

  useEffect(() => {
    if (hasSurvey === false) navigate({ to: "/onboarding" });
  }, [hasSurvey, navigate]);

  // Najbliższa misja: pierwsze nieukończone zadanie z pierwszej dostępnej lekcji
  const mission = useMemo(() => {
    if (data.tasks.length === 0) return null;
    const completed = new Set(
      data.submissions.filter((s) => s.status === "approved").map((s) => s.task_id),
    );
    const next = data.tasks.find((t) => !completed.has(t.id));
    return next ?? null;
  }, [data.tasks, data.submissions]);

  // Kursy: oblicz unlocked/progress
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

  const upcoming = useMemo(
    () => data.tasks.slice(0, 3).map((t) => t.title),
    [data.tasks],
  );

  if (authLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex gap-6">
        <Sidebar />

        <main className="flex-1 min-w-0 grid xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-6">
          <div className="space-y-5 min-w-0">
            <TopBar fullName={fullName} notificationsCount={data.notificationsCount} />
            <StatCards
              level={data.level}
              totalXp={data.totalXp}
              xpToNext={data.xpToNext}
              pctToNext={Math.round(data.pctToNext)}
            />
            <MissionCard
              title={mission?.title}
              description={mission?.instructions ?? undefined}
              xpReward={mission?.xp_reward ?? 120}
              unlocked={!!mission}
              upcoming={upcoming}
              onAction={() => mission && setSubmitTaskId(mission.id)}
            />
            <CoursesSection courses={enrichedCourses} />
            <TasksAndAchievements />
          </div>

          {isAdmin && (
            <div className="min-w-0">
              <div className="xl:sticky xl:top-6">
                <AdminPanel />
              </div>
            </div>
          )}

          <div className={isAdmin ? "xl:col-span-2" : ""}>
            <ProgressPath />
          </div>
        </main>
      </div>

      <AdvisorButton />

      <SubmitTaskDialog
        taskId={submitTaskId}
        taskTitle={mission?.title}
        open={!!submitTaskId}
        onOpenChange={(v) => !v && setSubmitTaskId(null)}
        onSubmitted={data.refresh}
      />
    </div>
  );
}
