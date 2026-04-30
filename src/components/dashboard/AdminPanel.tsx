import { useState } from "react";
import { Plus, Mail, Phone, ChevronRight, Send, RefreshCw, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";

const tabs = ["Podgląd", "Ankieta", "Zadania", "Problemy", "Aktywność", "Notatki"];

const survey = [
  { q: "Czy masz już pomysł na produkt?", a: "Tak", positive: true },
  { q: "Czy masz już ofertę?", a: "Nie", positive: false },
  { q: "Czy masz stronę sprzedażową?", a: "Nie", positive: false },
  { q: "Największy problem", a: "Nie umiem napisać oferty", neutral: true },
  { q: "Cel na 90 dni", a: "Pierwsza sprzedaż", neutral: true },
  { q: "Ile czasu tygodniowo?", a: "5 godzin", neutral: true },
];

const stats = [
  ["Data rejestracji", "12.04.2024"],
  ["Ostatnie logowanie", "Dzisiaj, 10:23"],
  ["Ukończone kursy", "1 / 8"],
  ["Zadania wykonane", "8 / 24"],
  ["Przesłane zadania", "3"],
  ["Zgłoszone problemy", "2"],
];

const adminTasks = [
  {
    title: "Popraw ofertę produktu",
    date: "20.05.2024",
    status: "Przesłane",
    xp: "+150 XP",
    color: "violet",
    icon: Send,
  },
  {
    title: "Stwórz nagłówek na landing page",
    date: "20.05.2024",
    status: "Do poprawy",
    xp: "+100 XP",
    color: "orange",
    icon: RefreshCw,
  },
  {
    title: "Przygotuj 3 pomysły na kampanię",
    date: "25.05.2024",
    status: "Do zrobienia",
    xp: "+150 XP",
    color: "blue",
    icon: Clock,
  },
  {
    title: "Nagraj wideo z obietnicą produktu",
    date: "28.05.2024",
    status: "Do zrobienia",
    xp: "+200 XP",
    color: "blue",
    icon: Clock,
  },
];

const taskColors = {
  violet: "bg-violet-soft text-violet",
  orange: "bg-orange-soft text-orange",
  blue: "bg-blue-soft text-blue",
} as const;

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("Podgląd");

  return (
    <aside className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-violet p-[2.5px]">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-soft to-blue-soft grid place-items-center font-display font-bold text-violet text-xl">
              AN
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green border-2 border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display font-extrabold text-lg text-foreground">Anna Nowak</h2>
            <span className="px-2 py-0.5 rounded-md bg-green-soft text-green text-[10px] font-bold uppercase tracking-wide">
              Growth
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-soft text-violet text-[10px] font-bold uppercase tracking-wide">
              Poziom 2
            </span>
          </div>
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              <span>ania.nowak@example.com</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span>+48 123 456 789</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-extrabold text-2xl text-foreground flex items-center gap-1">
            860 <span className="text-xs font-semibold text-muted-foreground">XP</span>
          </div>
          <div className="text-[10px] text-green font-semibold">+120 XP do kolejnego poziomu</div>
          <div className="mt-1.5 w-32 h-1.5 rounded-full bg-muted overflow-hidden ml-auto">
            <div className="h-full w-[72%] bg-gradient-green rounded-full" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 -mb-px transition-colors",
              activeTab === t
                ? "border-violet text-violet"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Survey + Stats */}
      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-display font-bold text-sm">Odpowiedzi z ankiety</h4>
              <p className="text-[11px] text-muted-foreground">(Onboarding)</p>
            </div>
          </div>
          <ul className="space-y-2">
            {survey.map((s) => (
              <li key={s.q} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-muted-foreground flex-1">{s.q}</span>
                <span
                  className={cn(
                    "font-bold shrink-0 text-right",
                    s.positive && "text-green",
                    s.positive === false && "text-orange",
                    s.neutral && "text-foreground",
                  )}
                >
                  {s.a}
                </span>
              </li>
            ))}
          </ul>
          <button className="mt-3 text-xs font-semibold text-violet flex items-center gap-1 hover:gap-1.5 transition-all">
            Zobacz pełne odpowiedzi <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-muted/30 rounded-2xl p-4">
          <h4 className="font-display font-bold text-sm mb-3">Statystyki użytkownika</h4>
          <ul className="space-y-2">
            {stats.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-bold text-foreground">{v}</span>
              </li>
            ))}
          </ul>
          <button className="mt-3 text-xs font-semibold text-violet flex items-center gap-1 hover:gap-1.5 transition-all">
            Zobacz pełną aktywność <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Assigned tasks */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display font-bold text-sm">Przypisane zadania indywidualne</h4>
          <Button
            size="sm"
            className="rounded-xl bg-gradient-violet text-primary-foreground hover:bg-gradient-violet hover:opacity-95 h-8 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj zadanie
          </Button>
        </div>
        <ul className="space-y-2">
          {adminTasks.map((t) => {
            const Icon = t.icon;
            return (
              <li
                key={t.title}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-violet/40 transition-colors"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                    taskColors[t.color as keyof typeof taskColors],
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">Termin: {t.date}</div>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-1 rounded-md shrink-0",
                    taskColors[t.color as keyof typeof taskColors],
                  )}
                >
                  {t.status}
                </span>
                <span className="text-xs font-bold text-violet w-14 text-right shrink-0 flex items-center gap-1 justify-end">
                  <Zap className="w-3 h-3 fill-violet" /> {t.xp}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Notes */}
      <div className="mt-5 relative">
        <div className="bg-violet-soft/50 border border-violet/20 rounded-2xl p-4">
          <h4 className="font-display font-bold text-sm mb-2">Notatki administratora</h4>
          <ul className="space-y-1.5 text-xs text-foreground/85">
            <li className="flex gap-2">
              <span className="text-violet">•</span>Dobry pomysł na produkt, ale problem z
              komunikacją wartości
            </li>
            <li className="flex gap-2">
              <span className="text-violet">•</span>Warto zaproponować pakiet PRO
            </li>
            <li className="flex gap-2">
              <span className="text-violet">•</span>Umówić rozmowę w przyszłym tygodniu
            </li>
            <li className="flex gap-2">
              <span className="text-violet">•</span>Potencjał na 10k+ miesięcznie
            </li>
          </ul>
        </div>
        <div className="hidden xl:flex absolute -right-2 -bottom-4 items-center gap-1 pointer-events-none">
          <SketchArrow direction="left" className="w-16 h-10 -rotate-12 text-orange" />
          <span className="font-hand text-orange text-sm font-bold leading-tight">
            Twoje notatki
            <br />
            (niewidoczne
            <br />
            dla użytkownika)
          </span>
        </div>
      </div>
    </aside>
  );
}
