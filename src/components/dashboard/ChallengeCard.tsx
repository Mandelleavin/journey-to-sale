import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Zap } from "lucide-react";

export type Challenge = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  goal_value: number;
  xp_reward: number;
  ends_at: string;
  progress: number;
  completed_at: string | null;
  claimed: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  daily: "Codzienne",
  weekly: "Tygodniowe",
  sprint: "Sprint",
  community: "Społeczność",
};

const TYPE_COLOR: Record<string, string> = {
  daily: "bg-blue-soft text-blue",
  weekly: "bg-violet-soft text-violet",
  sprint: "bg-orange/10 text-orange",
  community: "bg-green/10 text-green",
};

function timeLeft(end: string) {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "Zakończone";
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h pozostało`;
  return `${Math.floor(h / 24)} dni pozostało`;
}

export function ChallengeCard({
  challenge,
  onClaim,
  claiming,
}: {
  challenge: Challenge;
  onClaim?: (id: string) => void;
  claiming?: boolean;
}) {
  const pct = Math.min(100, Math.round((challenge.progress / challenge.goal_value) * 100));
  const completed = !!challenge.completed_at;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet grid place-items-center">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-extrabold text-foreground">{challenge.title}</div>
            <span
              className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded ${TYPE_COLOR[challenge.type] ?? ""}`}
            >
              {TYPE_LABEL[challenge.type] ?? challenge.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-violet font-bold text-sm">
          <Zap className="w-4 h-4" />+{challenge.xp_reward}
        </div>
      </div>
      {challenge.description && (
        <p className="text-sm text-muted-foreground">{challenge.description}</p>
      )}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-semibold">
            {challenge.progress} / {challenge.goal_value}
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {timeLeft(challenge.ends_at)}
          </span>
        </div>
        <Progress value={pct} />
      </div>
      {completed && !challenge.claimed && onClaim && (
        <Button
          onClick={() => onClaim(challenge.id)}
          disabled={claiming}
          className="w-full bg-gradient-violet text-primary-foreground"
        >
          {claiming ? "Odbieranie..." : `Odbierz +${challenge.xp_reward} XP`}
        </Button>
      )}
      {challenge.claimed && (
        <div className="text-center text-xs font-bold text-green">✓ Nagroda odebrana</div>
      )}
    </div>
  );
}
