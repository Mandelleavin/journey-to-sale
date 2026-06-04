import { useEffect, useState } from "react";
import { LogOut, Shield, Sparkles as SparklesIcon, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "./NotificationsBell";
import { StreakBadge } from "./StreakBadge";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { accountItems } from "@/lib/nav-items";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

type Props = {
  fullName?: string;
  notificationsCount?: number;
};

export function TopBar({ fullName, notificationsCount = 0 }: Props) {
  const { signOut, isAdmin, user } = useAuth();
  const { restart: restartTour } = useOnboarding();
  const { credits } = useCredits();
  const name = fullName?.split(" ")[0] || "Twórco";
  const [streak, setStreak] = useState({ current: 0, multiplier: 1 });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_streaks")
      .select("current_streak, multiplier")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStreak({ current: data.current_streak, multiplier: Number(data.multiplier) });
      });
  }, [user]);
  const initials = (fullName ?? "TW")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-foreground tracking-tight">
            Witaj, {name}!
          </h1>
          <span className="text-2xl md:text-3xl">👋</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
          Każdy dzień przybliża Cię do pierwszej sprzedaży online.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {isAdmin && (
          <Link
            to="/admin"
            className="rounded-xl bg-gradient-violet px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-glow inline-flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" /> Panel admina
          </Link>
        )}

        <Link
          to="/credits"
          title="Twoje kredyty AI"
          data-tour="credits-pill"
          className="hidden sm:flex items-center gap-2 bg-card rounded-2xl border border-border shadow-soft px-3 py-2 hover:shadow-glow transition-shadow"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-violet grid place-items-center">
            <Zap className="w-4 h-4 text-white fill-white/30" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-extrabold text-sm text-foreground">
              {credits?.available ?? 0} kredytów
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase">
              AI · doładuj
            </div>
          </div>
        </Link>


        <StreakBadge current={streak.current} multiplier={streak.multiplier} />

        <NotificationsBell initialCount={notificationsCount} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title="Twoje konto"
              data-tour="account-menu"
              className="hidden sm:block w-12 h-12 rounded-full bg-gradient-violet p-[2px] hover:opacity-90 transition-opacity"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-soft to-blue-soft grid place-items-center font-display font-bold text-violet text-sm">
                {initials}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{fullName || "Twoje konto"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountItems.map((it) => {
              const Icon = it.icon;
              return (
                <DropdownMenuItem key={it.to} asChild>
                  <Link to={it.to} className="flex items-center gap-2 cursor-pointer">
                    <Icon className="w-4 h-4" />
                    <span>{it.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => restartTour()} className="cursor-pointer">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Pokaż wprowadzenie
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Wyloguj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
