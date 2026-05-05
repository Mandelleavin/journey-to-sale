import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Flame, Zap, Calendar } from "lucide-react";

export const Route = createFileRoute("/u/$userId")({
  component: PublicProfile,
});

function PublicProfile() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<{ full_name: string | null; created_at: string } | null>(
    null,
  );
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: xp }, { data: st }] = await Promise.all([
        supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
        supabase.from("user_xp_log").select("amount").eq("user_id", userId),
        supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      setProfile(p ? { full_name: p.full_name, created_at: p.created_at } : null);
      setTotalXp((xp ?? []).reduce((s, r) => s + r.amount, 0));
      setStreak(st?.current_streak ?? 0);
    })();
  }, [userId]);

  const level = Math.floor(totalXp / 500) + 1;
  const day = profile?.created_at
    ? Math.max(
        1,
        Math.min(
          90,
          Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) + 1,
        ),
      )
    : 1;

  return (
    <PageShell title={profile?.full_name ?? "Profil"} subtitle="Profil publiczny uczestnika">
      <Link
        to="/"
        className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Wróć
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
          <Zap className="w-5 h-5 text-violet mx-auto" />
          <div className="font-display font-extrabold text-xl">{totalXp}</div>
          <div className="text-xs text-muted-foreground">XP · Level {level}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
          <Flame className="w-5 h-5 text-orange mx-auto" />
          <div className="font-display font-extrabold text-xl">{streak}</div>
          <div className="text-xs text-muted-foreground">dni serii</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
          <Calendar className="w-5 h-5 text-blue mx-auto" />
          <div className="font-display font-extrabold text-xl">{day}/90</div>
          <div className="text-xs text-muted-foreground">dzień ścieżki</div>
        </div>
      </div>
    </PageShell>
  );
}
