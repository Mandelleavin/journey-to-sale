import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  required_xp: number;
  position: number;
};

export type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  position: number;
  unlock_after_hours: number;
  due_in_days: number | null;
  xp_reward: number;
};

export type LessonTaskRow = {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string | null;
  is_required: boolean;
  xp_reward: number;
  due_in_days: number | null;
};

export type SubmissionRow = {
  id: string;
  task_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  content: string;
  admin_feedback: string | null;
  created_at: string;
};

export type DashboardData = {
  loading: boolean;
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  pctToNext: number;
  courses: CourseRow[];
  lessons: LessonRow[];
  tasks: LessonTaskRow[];
  enrolledCourseIds: Set<string>;
  watchedLessonIds: Set<string>;
  submissions: SubmissionRow[];
  notificationsCount: number;
  refresh: () => Promise<void>;
};

const XP_PER_LEVEL = 500;

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [tasks, setTasks] = useState<LessonTaskRow[]>([]);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [xpRes, coursesRes, lessonsRes, tasksRes, enrollRes, progressRes, subsRes, notifRes] =
      await Promise.all([
        supabase.from("user_xp_log").select("amount").eq("user_id", user.id),
        supabase.from("courses").select("*").eq("is_published", true).order("position"),
        supabase.from("lessons").select("*").eq("is_published", true).order("position"),
        supabase.from("lesson_tasks").select("*"),
        supabase.from("user_course_enrollments").select("course_id").eq("user_id", user.id),
        supabase.from("user_lesson_progress").select("lesson_id").eq("user_id", user.id),
        supabase
          .from("task_submissions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);

    setTotalXp((xpRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
    setCourses((coursesRes.data ?? []) as CourseRow[]);
    setLessons((lessonsRes.data ?? []) as LessonRow[]);
    setTasks((tasksRes.data ?? []) as LessonTaskRow[]);
    setEnrolled(new Set((enrollRes.data ?? []).map((r) => r.course_id)));
    setWatched(new Set((progressRes.data ?? []).map((r) => r.lesson_id)));
    setSubmissions((subsRes.data ?? []) as SubmissionRow[]);
    setNotificationsCount(notifRes.count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const pctToNext = (xpInLevel / XP_PER_LEVEL) * 100;

  return {
    loading,
    totalXp,
    level,
    xpInLevel,
    xpToNext,
    pctToNext,
    courses,
    lessons,
    tasks,
    enrolledCourseIds: enrolled,
    watchedLessonIds: watched,
    submissions,
    notificationsCount,
    refresh: load,
  };
}
