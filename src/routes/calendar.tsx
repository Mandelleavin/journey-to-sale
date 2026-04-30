import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

type EventItem = { date: Date; title: string; type: "mentor" | "lesson" };

function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: mt }, { data: enr }, { data: lessons }] = await Promise.all([
        supabase
          .from("mentor_assigned_tasks")
          .select("title, due_date")
          .eq("user_id", user.id)
          .not("due_date", "is", null),
        supabase
          .from("user_course_enrollments")
          .select("course_id, enrolled_at")
          .eq("user_id", user.id),
        supabase
          .from("lessons")
          .select("title, course_id, due_in_days")
          .not("due_in_days", "is", null),
      ]);

      const evts: EventItem[] = [];
      for (const t of mt ?? []) {
        if (t.due_date) evts.push({ date: new Date(t.due_date), title: t.title, type: "mentor" });
      }
      const enrMap = new Map((enr ?? []).map((e) => [e.course_id, new Date(e.enrolled_at)]));
      for (const l of lessons ?? []) {
        const start = enrMap.get(l.course_id);
        if (start && l.due_in_days != null) {
          evts.push({
            date: new Date(start.getTime() + l.due_in_days * 86400000),
            title: l.title,
            type: "lesson",
          });
        }
      }
      setEvents(evts);
    })();
  }, [user]);

  const eventDays = useMemo(() => events.map((e) => e.date), [events]);

  const dayEvents = useMemo(() => {
    if (!selected) return [];
    return events.filter((e) => e.date.toDateString() === selected.toDateString());
  }, [events, selected]);

  return (
    <PageShell title="Kalendarz" subtitle="Wszystkie deadline'y w jednym miejscu">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ event: eventDays }}
            modifiersClassNames={{ event: "bg-violet-soft font-bold text-violet" }}
            className="rounded-md"
          />
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-5 h-5 text-violet" />
            <h2 className="font-display font-bold">
              {selected?.toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak wydarzeń.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((e, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold text-sm">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.type === "mentor" ? "Zadanie od mentora" : "Deadline lekcji"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
