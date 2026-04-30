import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/problems")({
  head: () => ({
    meta: [
      { title: "Problemy — 90 Dni" },
      {
        name: "description",
        content: "Zgłoś problem techniczny lub merytoryczny — odpowiemy szybko.",
      },
    ],
  }),
  component: ProblemsPage,
});

type Report = {
  id: string;
  category: string;
  description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
};

function ProblemsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState("technical");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("problem_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setReports((data ?? []) as Report[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const submit = async () => {
    if (!user || !description.trim()) return toast.error("Opisz problem");
    const { error } = await supabase.from("problem_reports").insert({
      user_id: user.id,
      category: category as never,
      description,
    });
    if (error) return toast.error(error.message);
    toast.success("Zgłoszenie wysłane");
    setDescription("");
    load();
  };

  return (
    <PageShell title="Problemy" subtitle="Coś nie działa? Masz pytanie? Napisz do nas.">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Nowe zgłoszenie</h2>
        <div className="space-y-3">
          <div className="grid md:grid-cols-[200px_1fr] gap-3">
            <div>
              <Label>Kategoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Problem techniczny</SelectItem>
                  <SelectItem value="content">Treść / kurs</SelectItem>
                  <SelectItem value="payment">Płatności</SelectItem>
                  <SelectItem value="other">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opis problemu</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz dokładnie co się stało, co próbowałeś/aś zrobić..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <Button onClick={submit} className="bg-gradient-violet text-primary-foreground">
            Wyślij zgłoszenie
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Historia zgłoszeń</h2>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Brak zgłoszeń</div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(r.created_at).toLocaleString("pl-PL")} · {r.category}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{r.description}</p>
                    {r.admin_response && (
                      <div className="mt-2 rounded-xl bg-muted/40 p-3 text-sm">
                        <b>Odpowiedź:</b> {r.admin_response}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      r.status === "resolved"
                        ? "border-green/40 text-green"
                        : r.status === "in_progress"
                          ? "border-blue/40 text-blue"
                          : "border-orange/40 text-orange"
                    }
                  >
                    {r.status === "resolved" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Rozwiązane
                      </>
                    ) : r.status === "in_progress" ? (
                      <>
                        <Clock className="w-3 h-3 mr-1" /> W trakcie
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" /> Otwarte
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
