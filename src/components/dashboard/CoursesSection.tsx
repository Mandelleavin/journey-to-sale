import {
  Lightbulb,
  FileText,
  MonitorPlay,
  Megaphone,
  Lock,
  Check,
  GraduationCap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";

const icons = [Lightbulb, FileText, MonitorPlay, Megaphone, GraduationCap];
const colors = ["green", "blue", "violet", "orange"] as const;

type Course = {
  id: string;
  num: number;
  title: string;
  progress: number; // 0-100
  required_xp: number;
  unlocked: boolean;
  done: boolean;
  color: (typeof colors)[number];
};

const colorMap = {
  green: {
    bg: "bg-green-soft",
    text: "text-green",
    grad: "bg-gradient-green",
    border: "border-green/40",
  },
  blue: {
    bg: "bg-blue-soft",
    text: "text-blue",
    grad: "bg-gradient-blue",
    border: "border-blue/40",
  },
  violet: {
    bg: "bg-violet-soft",
    text: "text-violet",
    grad: "bg-gradient-violet",
    border: "border-violet/40",
  },
  orange: {
    bg: "bg-orange-soft",
    text: "text-orange",
    grad: "bg-gradient-orange",
    border: "border-orange/40",
  },
};

const fallback: Course[] = [
  {
    id: "1",
    num: 1,
    title: "PomysĹ‚ na pierwszy produkt online",
    progress: 100,
    required_xp: 0,
    unlocked: true,
    done: true,
    color: "green",
  },
  {
    id: "2",
    num: 2,
    title: "StwĂłrz ofertÄ™ za 97â€“497 zĹ‚",
    progress: 75,
    required_xp: 0,
    unlocked: true,
    done: false,
    color: "blue",
  },
  {
    id: "3",
    num: 3,
    title: "Landing page, ktĂłry sprzedaje",
    progress: 25,
    required_xp: 500,
    unlocked: false,
    done: false,
    color: "violet",
  },
  {
    id: "4",
    num: 4,
    title: "Pierwsze reklamy na produkt",
    progress: 0,
    required_xp: 1000,
    unlocked: false,
    done: false,
    color: "orange",
  },
];

export function CoursesSection({ courses, fullName }: { courses?: Course[]; fullName?: string }) {
  const data = courses && courses.length > 0 ? courses : fallback;
  const firstName = fullName?.trim().split(/\s+/)[0];
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <span className="text-violet">Twoje kursy{firstName ? `, ${firstName}` : ""}</span>
        </h3>
        <div className="hidden md:flex items-center gap-2 relative">
          <span className="font-hand text-orange text-base font-bold leading-tight text-right max-w-[200px]">
            Kursy odblokowywane
            <br />
            za XP lub postÄ™py
          </span>
          <SketchArrow direction="right" className="w-20 h-10 rotate-12 text-orange" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((c) => {
          const cm = colorMap[c.color];
          const Icon = icons[(c.num - 1) % icons.length];
          const isLocked = !c.unlocked;
          const isRealCourse = c.id.length > 5; // uuid vs fallback "1"
          const card = (
            <div
              className={cn(
                "relative bg-card rounded-2xl p-4 border-2 transition-all hover:-translate-y-0.5 block",
                cm.border,
                isLocked && "opacity-90 pointer-events-none",
              )}
              style={{ boxShadow: "0 6px 20px -8px oklch(0.4 0.1 280 / 0.15)" }}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {c.required_xp} XP
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className={cn("font-display font-extrabold text-3xl", cm.text)}>{c.num}</span>
                <div className={cn("w-9 h-9 rounded-xl grid place-items-center", cm.bg)}>
                  <Icon className={cn("w-4 h-4", cm.text)} strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3 font-display font-semibold text-sm text-foreground leading-snug min-h-[2.5rem]">
                {c.title}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", cm.grad)}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                {c.done ? (
                  <div className="w-5 h-5 rounded-full bg-green grid place-items-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {isLocked ? "Zablokowany" : `${c.progress}%`}
                  </span>
                )}
              </div>
            </div>
          );

          return isLocked || !isRealCourse ? (
            <div key={c.id}>{card}</div>
          ) : (
            <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
