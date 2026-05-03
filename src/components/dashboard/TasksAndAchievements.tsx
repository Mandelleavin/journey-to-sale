import {
  CheckSquare,
  Square,
  PlayCircle,
  Award,
  FileCheck,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialTasks = [
  {
    title: "Napisz swoją ofertę",
    status: "W trakcie",
    xp: "+150 XP",
    color: "blue",
    checked: false,
  },
  {
    title: "Stwórz nazwę produktu",
    status: "Do zrobienia",
    xp: "+100 XP",
    color: "muted",
    checked: false,
  },
  {
    title: "Stwórz landing page (link)",
    status: "Zatwierdzone",
    xp: "+200 XP",
    color: "green",
    checked: true,
  },
];

const statusStyle = {
  blue: "bg-blue-soft text-blue",
  muted: "bg-muted text-muted-foreground",
  green: "bg-green-soft text-green",
} as const;

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
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Tasks */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-5">
        <h3 className="font-display font-bold text-base mb-3">Moje zadania od mentora</h3>
        <ul className="divide-y divide-border">
          {tasks.map((t) => (
            <li key={t.title} className="flex items-center gap-3 py-3">
              {t.checked ? (
                <CheckSquare className="w-4 h-4 text-green shrink-0" strokeWidth={2.2} />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2.2} />
              )}
              <span className="flex-1 text-sm font-medium text-foreground">{t.title}</span>
              <span
                className={cn(
                  "text-[11px] font-semibold px-2 py-1 rounded-md",
                  statusStyle[t.color as keyof typeof statusStyle],
                )}
              >
                {t.status}
              </span>
              <span className="text-xs font-bold text-violet w-14 text-right">{t.xp}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          className="w-full mt-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-semibold"
        >
          Zobacz wszystkie zadania
        </Button>
      </div>

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
          className="w-full mt-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-semibold"
        >
          Zobacz wszystkie osiągnięcia
        </Button>
      </div>
    </div>
  );
}
