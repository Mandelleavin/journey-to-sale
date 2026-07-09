import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Trash2, KeyRound, Plus, Search, Eye, Users, Loader2 } from "lucide-react";
import {
  adminGetPlanSettings,
  adminUpdatePlanSettings,
  adminListAccessCodes,
  adminCreateAccessCodes,
  adminDeleteAccessCode,
  adminGetPlanAnalytics,
  adminListPlanUsers,
  adminGetPlanUserSurvey,
  type AdminPlanUserSummary,
  type AdminPlanSurveyAnswer,
} from "@/lib/business-plan.functions";

export const Route = createFileRoute("/admin/business-plan")({
  component: AdminBusinessPlanPage,
});

type Settings = { global_password: string | null; is_open: boolean; updated_at: string | null };
type Code = {
  id: string;
  code: string;
  note: string | null;
  used_by_user_id: string | null;
  used_at: string | null;
  created_at: string;
};
type SurveyDetails = {
  user: { user_id: string; full_name: string | null; email: string };
  answers: AdminPlanSurveyAnswer[];
};

function AdminBusinessPlanPage() {
  const getSettings = useServerFn(adminGetPlanSettings);
  const updateSettings = useServerFn(adminUpdatePlanSettings);
  const listCodes = useServerFn(adminListAccessCodes);
  const createCodes = useServerFn(adminCreateAccessCodes);
  const deleteCode = useServerFn(adminDeleteAccessCode);
  const getAnalytics = useServerFn(adminGetPlanAnalytics);
  const listPlanUsers = useServerFn(adminListPlanUsers);
  const getUserSurvey = useServerFn(adminGetPlanUserSurvey);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [codes, setCodes] = useState<Code[]>([]);
  const [count, setCount] = useState(10);
  const [note, setNote] = useState("");
  const [analytics, setAnalytics] = useState<{
    usersWithAccess: number;
    totalResponses: number;
    perField: Record<string, number>;
  } | null>(null);
  const [planUsers, setPlanUsers] = useState<AdminPlanUserSummary[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminPlanUserSummary | null>(null);
  const [survey, setSurvey] = useState<SurveyDetails | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);

  const reload = async () => {
    const [s, c, a, u] = await Promise.all([
      getSettings(),
      listCodes(),
      getAnalytics(),
      listPlanUsers(),
    ]);
    setSettings(s);
    setPassword(s.global_password ?? "");
    setIsOpen(s.is_open);
    setCodes(c.codes as Code[]);
    setAnalytics(a);
    setPlanUsers(u.users);
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    await updateSettings({ data: { global_password: password || null, is_open: isOpen } });
    toast.success("Zapisano");
    reload();
  };

  const generate = async () => {
    await createCodes({ data: { count, note: note || undefined } });
    toast.success(`Utworzono ${count} kodów`);
    setNote("");
    reload();
  };

  const remove = async (id: string) => {
    await deleteCode({ data: { id } });
    reload();
  };

  const openSurvey = async (user: AdminPlanUserSummary) => {
    setSelectedUser(user);
    setSurvey(null);
    setSurveyLoading(true);
    try {
      const details = await getUserSurvey({ data: { userId: user.user_id } });
      setSurvey(details);
    } catch (error) {
      console.error("Loading business plan survey failed", error);
      toast.error("Nie udało się pobrać odpowiedzi użytkownika.");
    } finally {
      setSurveyLoading(false);
    }
  };

  const filteredUsers = planUsers.filter((user) => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return true;
    return `${user.full_name ?? ""} ${user.email}`.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Plan 12 tygodni</h1>
        <p className="text-sm text-muted-foreground">
          Hasło webinaru, kody VIP i statystyki wypełnienia planu.
        </p>
      </div>

      {/* Settings */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-xl font-extrabold mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-violet" /> Hasło webinaru
        </h2>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <Label className="text-xs font-bold uppercase">Hasło globalne</Label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Np. START2026"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch checked={isOpen} onCheckedChange={setIsOpen} />
            <span className="text-sm">Dostęp otwarty</span>
          </div>
          <Button onClick={saveSettings} className="bg-gradient-violet">
            Zapisz
          </Button>
        </div>
        {settings?.updated_at && (
          <p className="text-xs text-muted-foreground mt-3">
            Ostatnia zmiana: {new Date(settings.updated_at).toLocaleString("pl-PL")}
          </p>
        )}
      </section>

      {/* Codes */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-xl font-extrabold mb-4">Kody VIP (jednorazowe)</h2>
        <div className="grid md:grid-cols-[100px_1fr_auto] gap-3 items-end mb-6">
          <div>
            <Label className="text-xs font-bold uppercase">Ile</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase">Notatka (opcjonalnie)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Np. Webinar 2026-03-01"
              className="mt-1"
            />
          </div>
          <Button onClick={generate} className="bg-gradient-violet">
            <Plus className="w-4 h-4 mr-1" /> Wygeneruj
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {codes.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak kodów. Wygeneruj nową pulę.</p>
          )}
          {codes.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <code className="font-mono font-bold text-base flex-1">{c.code}</code>
              {c.used_at ? (
                <Badge className="bg-muted text-muted-foreground border-0">Użyty</Badge>
              ) : (
                <Badge className="bg-green-soft text-green border-0">Aktywny</Badge>
              )}
              {c.note && <span className="text-xs text-muted-foreground">{c.note}</span>}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  toast.success("Skopiowano");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-xl font-extrabold mb-4">Statystyki</h2>
        {!analytics ? (
          <p className="text-sm text-muted-foreground">Ładowanie…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-violet-soft/30 p-4">
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Użytkownicy z dostępem
                </div>
                <div className="text-3xl font-display font-extrabold text-violet">
                  {analytics.usersWithAccess}
                </div>
              </div>
              <div className="rounded-2xl bg-blue-soft/30 p-4">
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Wypełnione odpowiedzi
                </div>
                <div className="text-3xl font-display font-extrabold text-blue">
                  {analytics.totalResponses}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">
              Najczęściej wypełniane pola
            </h3>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {Object.entries(analytics.perField)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30)
                .map(([k, n]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-border py-2">
                    <code className="text-xs">{k}</code>
                    <span className="font-bold">{n}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </section>

      {/* User surveys */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
              <Users className="h-5 w-5 text-violet" /> Ankiety użytkowników
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Postęp i kompletne odpowiedzi zapisane w Planie 12 tygodni.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Szukaj po imieniu lub e-mailu"
              className="pl-9"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            {planUsers.length === 0
              ? "Nikt jeszcze nie odblokował ani nie wypełnił planu."
              : "Nie znaleziono użytkownika."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead className="min-w-48">Postęp</TableHead>
                <TableHead>Odpowiedzi</TableHead>
                <TableHead>Ostatnia aktywność</TableHead>
                <TableHead className="text-right">Podgląd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="font-semibold">{user.full_name || "Bez imienia"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{user.completion_percent}%</span>
                      {user.granted_via && (
                        <Badge variant="secondary" className="text-[10px]">
                          {user.granted_via === "code" ? "Kod VIP" : "Hasło"}
                        </Badge>
                      )}
                    </div>
                    <Progress value={user.completion_percent} className="h-2" />
                  </TableCell>
                  <TableCell className="font-semibold">{user.answered_fields}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.last_answer_at
                      ? new Date(user.last_answer_at).toLocaleString("pl-PL")
                      : user.granted_at
                        ? new Date(user.granted_at).toLocaleString("pl-PL")
                        : "Brak"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openSurvey(user)}>
                      <Eye className="mr-1 h-4 w-4" /> Zobacz ankietę
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setSurvey(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser?.full_name || "Ankieta użytkownika"}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>

          {surveyLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Ładowanie odpowiedzi…
            </div>
          ) : survey?.answers.length ? (
            <SurveyAnswers answers={survey.answers} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Ten użytkownik nie zapisał jeszcze żadnej odpowiedzi.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SurveyAnswers({ answers }: { answers: AdminPlanSurveyAnswer[] }) {
  const sections = new Map<
    string,
    { title: string; emoji: string | null; answers: AdminPlanSurveyAnswer[] }
  >();
  for (const answer of answers) {
    const section = sections.get(answer.section_id) ?? {
      title: answer.section_title,
      emoji: answer.section_emoji,
      answers: [],
    };
    section.answers.push(answer);
    sections.set(answer.section_id, section);
  }

  return (
    <div className="space-y-5">
      {Array.from(sections.entries()).map(([sectionId, section]) => (
        <section key={sectionId} className="rounded-2xl border border-border p-4">
          <h3 className="mb-4 font-display text-lg font-extrabold">
            {section.emoji && <span className="mr-2">{section.emoji}</span>}
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.answers.map((answer) => (
              <div
                key={answer.field_key}
                className="border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold">{answer.label}</div>
                  <div className="flex items-center gap-2">
                    {answer.source === "lesson" && (
                      <Badge className="border-0 bg-blue-soft text-[10px] text-blue">
                        Z lekcji
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(answer.updated_at).toLocaleString("pl-PL")}
                    </span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap rounded-xl bg-muted/60 p-3 text-sm">
                  {formatAnswerValue(answer.value)}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function formatAnswerValue(value: AdminPlanSurveyAnswer["value"]): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Brak odpowiedzi";
  if (value === null || value === undefined || value === "") return "Brak odpowiedzi";
  if (typeof value === "boolean") return value ? "Tak" : "Nie";
  return String(value);
}
