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
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
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

const achievements = [
  { icon: PlayCircle, title: "Obejrzałeś lekcję", xp: "+30 XP", time: "2h temu", color: "violet" },
  {
    icon: FileCheck,
    title: "Przesłałeś zadanie",
    xp: "+100 XP",
    time: "1 dzień temu",
    color: "blue",
  },
  {
    icon: Award,
    title: "Zatwierdzono Twoje zadanie",
    xp: "+150 XP",
    time: "2 dni temu",
    color: "green",
  },
  { icon: Trophy, title: "Ukończyłeś kurs", xp: "+200 XP", time: "3 dni temu", color: "orange" },
];

const achColor = {
  violet: "bg-violet-soft text-violet",
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
} as const;

export function TasksAndAchievements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("mentor_assigned_tasks")
      .select("id, title, xp_reward, due_date, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setTasks((data ?? []) as MentorTask[]);
    setLoading(false);
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
        <ul className="divide-y divide-border">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.title} className="flex items-center gap-3 py-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                    achColor[a.color as keyof typeof achColor],
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{a.title}</span>
                <span className="text-xs font-bold text-violet flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-violet" />
                  {a.xp}
                </span>
                <span className="text-[11px] text-muted-foreground w-20 text-right">{a.time}</span>
              </li>
            );
          })}
        </ul>
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/badges" })}
          className="w-full mt-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-semibold"
        >
          Zobacz wszystkie osiągnięcia
        </Button>
      </div>
    </div>
  );
}
