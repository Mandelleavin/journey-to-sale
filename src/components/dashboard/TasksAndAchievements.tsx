import { useEffect, useState } from "react";
import {
  CheckSquare,
  Square,
  CircleDashed,
  PlayCircle,
  Award,
  FileCheck,
  Trophy,
  Zap,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type MentorTask = {
  id: string;
  title: string;
  xp_reward: number;
  due_date: string | null;
  status: "assigned" | "in_progress" | "submitted" | "approved" | "rejected" | "needs_revision";
};

const STATUS_META: Record<
  MentorTask["status"],
  { label: string; tone: string; userToggleable: boolean }
> = {
  assigned: {
    label: "Do zrobienia",
    tone: "bg-muted text-muted-foreground",
    userToggleable: true,
  },
  in_progress: { label: "W trakcie", tone: "bg-blue-soft text-blue", userToggleable: true },
  submitted: { label: "Wysłane", tone: "bg-violet-soft text-violet", userToggleable: false },
  approved: { label: "Zatwierdzone", tone: "bg-green-soft text-green", userToggleable: false },
  rejected: {
    label: "Odrzucone",
    tone: "bg-destructive/10 text-destructive",
    userToggleable: false,
  },
  needs_revision: { label: "Do poprawy", tone: "bg-orange-soft text-orange", userToggleable: true },
};

type AchievementColor = "violet" | "blue" | "green" | "orange";
type AchievementRow = {
  id: string;
  title: string;
  xp: number;
  createdAt: string;
  icon: typeof PlayCircle;
  color: AchievementColor;
};

const achColor = {
  violet: "bg-violet-soft text-violet",
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
} as const;

function mapXpReason(reason: string): { title: string; icon: typeof PlayCircle; color: AchievementColor } {
  const r = reason.toLowerCase();
  if (r.startsWith("tool:")) {
    const slug = reason.split(":")[1] ?? "narzędzie";
    return { title: `Użyłeś narzędzia: ${slug}`, icon: Zap, color: "violet" };
  }
  if (r.includes("zatwierdz")) return { title: "Zatwierdzono Twoje zadanie", icon: Award, color: "green" };
  if (r.includes("lekcj")) return { title: "Ukończyłeś lekcję", icon: PlayCircle, color: "violet" };
  if (r.includes("zadan") || r.includes("task")) return { title: "Przesłałeś zadanie", icon: FileCheck, color: "blue" };
  if (r.includes("kurs") || r.includes("course")) return { title: "Ukończyłeś kurs", icon: Trophy, color: "orange" };
  if (r.includes("badge") || r.includes("odznak")) return { title: "Zdobyłeś odznakę", icon: Award, color: "orange" };
  if (r.includes("misj")) return { title: "Wykonałeś misję", icon: Trophy, color: "orange" };
  if (r.includes("streak") || r.includes("seri")) return { title: "Utrzymujesz serię dni", icon: Zap, color: "orange" };
  return { title: reason, icon: Award, color: "blue" };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "przed chwilą";
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h temu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? "dzień" : "dni"} temu`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} tyg. temu`;
  return new Date(iso).toLocaleDateString("pl-PL");
}

export function TasksAndAchievements() {
  
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [loadingAch, setLoadingAch] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setLoadingAch(true);
    const [tasksRes, xpRes] = await Promise.all([
      supabase
        .from("mentor_assigned_tasks")
        .select("id, title, xp_reward, due_date, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_xp_log")
        .select("id, amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setTasks((tasksRes.data ?? []) as MentorTask[]);
    const rows = (xpRes.data ?? [])
      .map((x) => {
        const meta = mapXpReason(x.reason);
        return {
          id: x.id,
          title: meta.title,
          icon: meta.icon,
          color: meta.color,
          xp: x.amount,
          createdAt: x.created_at,
        } satisfies AchievementRow;
      })
      // Deduplikacja po tytule — zachowujemy najnowsze wystąpienie
      .reduce<AchievementRow[]>((acc, curr) => {
        if (!acc.some((a) => a.title === curr.title)) acc.push(curr);
        return acc;
      }, [])
      .slice(0, 5);
    setAchievements(rows);
    setLoading(false);
    setLoadingAch(false);
  };

  useEffect(() => {
    load();
  }, [user]);


  const toggleStatus = async (t: MentorTask) => {
    const meta = STATUS_META[t.status];
    if (!meta.userToggleable) {
      toast.info("Tylko administrator może zmienić ten status");
      return;
    }
    // Cycle: assigned -> in_progress -> assigned. needs_revision -> in_progress.
    const next: MentorTask["status"] =
      t.status === "in_progress" ? "assigned" : "in_progress";
    setPendingId(t.id);
    const { error } = await supabase
      .from("mentor_assigned_tasks")
      .update({ status: next })
      .eq("id", t.id);
    setPendingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
  };

  const renderIcon = (t: MentorTask) => {
    if (t.status === "approved")
      return <CheckSquare className="w-4 h-4 text-green" strokeWidth={2.2} />;
    if (t.status === "submitted")
      return <CircleDashed className="w-4 h-4 text-violet animate-spin-slow" strokeWidth={2.2} />;
    if (t.status === "in_progress")
      return <CircleDashed className="w-4 h-4 text-blue" strokeWidth={2.2} />;
    if (t.status === "rejected") return <Lock className="w-4 h-4 text-destructive" strokeWidth={2.2} />;
    return <Square className="w-4 h-4 text-muted-foreground" strokeWidth={2.2} />;
  };

  return (
    <div className="grid gap-4">
      {/* Achievements */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base">Najnowsze osiągnięcia</h3>
          <Trophy className="w-4 h-4 text-orange" />
        </div>
        {loadingAch ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Ładowanie…</div>
        ) : achievements.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Brak osiągnięć — zacznij od pierwszej misji, żeby zdobyć XP.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {achievements.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                      achColor[a.color],
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{a.title}</span>
                  <span className="text-xs font-bold text-violet flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-violet" />
                    +{a.xp} XP
                  </span>
                  <span className="text-[11px] text-muted-foreground w-20 text-right">
                    {relativeTime(a.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
