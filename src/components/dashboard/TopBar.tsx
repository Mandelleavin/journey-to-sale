import { useEffect, useState } from "react";
import { LogOut, Shield, Sparkles as SparklesIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SketchUnderline } from "./Sketch";
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
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground tracking-tight">
            Cześć, {name}!
          </h1>
          <span className="text-3xl md:text-4xl">👋</span>
        </div>
        <SketchUnderline className="w-40 h-3 -mt-1 ml-1" />
        <p className="text-sm text-muted-foreground mt-2">
          Super, że znowu działasz nad swoim produktem!
        </p>
      </div>

      <div className="flex items-center gap-3">
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
          className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-gradient-to-br from-violet-soft to-blue-soft pl-1.5 pr-3 py-1 shadow-soft hover:shadow-glow transition-shadow"
        >
          <span className="w-6 h-6 rounded-full bg-gradient-violet grid place-items-center text-primary-foreground">
            <SparklesIcon className="w-3.5 h-3.5" />
          </span>
          <span className="font-display font-extrabold text-sm text-violet leading-none">
            {credits?.available ?? 0}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground leading-none">
            kredytów
          </span>
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
