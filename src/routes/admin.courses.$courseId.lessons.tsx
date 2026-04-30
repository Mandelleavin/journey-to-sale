import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/courses/$courseId/lessons")({
  component: AllLessonsPage,
});

type Lesson = {
  id: string;
  title: string;
  module_id: string | null;
  position: number;
  xp_reward: number;
  is_published: boolean;
};
type Module = { id: string; title: string; position: number };

function AllLessonsPage() {
  const { courseId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<{ title: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: c }, { data: m }, { data: l }] = await Promise.all([
        supabase.from("courses").select("title").eq("id", courseId).maybeSingle(),
        supabase
          .from("modules")
          .select("id, title, position")
          .eq("course_id", courseId)
          .order("position"),
        supabase
          .from("lessons")
          .select("id, title, module_id, position, xp_reward, is_published")
          .eq("course_id", courseId)
          .order("position"),
      ]);
      setCourse(c as never);
      setModules((m ?? []) as Module[]);
      setLessons((l ?? []) as Lesson[]);
    })();
  }, [isAdmin, courseId]);

  if (loading || !isAdmin)
    return <div className="grid min-h-screen place-items-center bg-app">Ładowanie...</div>;

  const orphans = lessons.filter((l) => !l.module_id);

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-[1100px] p-4 md:p-6">
        <Link
          to="/admin/courses"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Powrót do kursów
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-2 mb-6">
          Wszystkie lekcje: {course?.title}
        </h1>

        <div className="space-y-4">
          {modules.map((m) => {
            const inMod = lessons.filter((l) => l.module_id === m.id);
            return (
              <Link
                key={m.id}
                to="/admin/modules/$moduleId"
                params={{ moduleId: m.id }}
                className="block rounded-2xl border border-border bg-card p-4 hover:border-violet/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-2">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{inMod.length} lekcji</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
          {orphans.length > 0 && (
            <div className="rounded-2xl border border-orange/40 bg-orange-soft/30 p-4">
              <div className="font-bold flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4" /> Lekcje bez modułu ({orphans.length})
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Te lekcje nie są przypisane do żadnego modułu. Edytuj je i przypisz moduł.
              </p>
              <ul className="text-sm space-y-1">
                {orphans.map((l) => (
                  <li key={l.id}>• {l.title}</li>
                ))}
              </ul>
            </div>
          )}
          {modules.length === 0 && orphans.length === 0 && (
            <div className="text-sm text-muted-foreground p-6 text-center">
              Brak lekcji w tym kursie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
