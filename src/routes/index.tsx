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
import { MentorTasksSection } from "@/components/dashboard/MentorTasksSection";
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
  const [readiness, setReadiness] = useState(0);
  const [profileCreated, setProfileCreated] = useState<string | null>(null);
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
        supabase.from("profiles").select("full_name, created_at").eq("id", user.id).maybeSingle(),
        supabase.from("survey_responses").select("id, readiness_percent").eq("user_id", user.id).maybeSingle(),
      ]);
      setFullName(prof?.full_name ?? undefined);
      setProfileCreated(prof?.created_at ?? null);
      setHasSurvey(!!survey);
      setReadiness(survey?.readiness_percent ?? 0);
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

        <main className="flex-1 min-w-0 space-y-5">
          <TopBar fullName={fullName} notificationsCount={data.notificationsCount} />
          <StatCards
            level={data.level}
            totalXp={data.totalXp}
            xpToNext={data.xpToNext}
            pctToNext={Math.round(data.pctToNext)}
            pathDay={(() => {
              if (!profileCreated) return 1;
              const d = Math.floor((Date.now() - new Date(profileCreated).getTime()) / 86400000) + 1;
              return Math.max(1, Math.min(90, d));
            })()}
            pathPct={(() => {
              if (!profileCreated) return 0;
              const d = Math.floor((Date.now() - new Date(profileCreated).getTime()) / 86400000) + 1;
              const day = Math.max(1, Math.min(90, d));
              return Math.round(((day - 1) / 89) * 100);
            })()}
            successPct={readiness}
          />
          <MissionCard
            title={mission?.title}
            description={mission?.instructions ?? undefined}
            xpReward={mission?.xp_reward ?? 120}
            unlocked={!!mission}
            upcoming={upcoming}
            onAction={() => mission && setSubmitTaskId(mission.id)}
          />
          <MentorTasksSection />
          <CoursesSection courses={enrichedCourses} />
          <div className="grid xl:grid-cols-2 gap-5">
            <TasksAndAchievements />
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

