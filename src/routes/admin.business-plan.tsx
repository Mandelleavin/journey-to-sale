import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Trash2, KeyRound, Plus } from "lucide-react";
import {
  adminGetPlanSettings,
  adminUpdatePlanSettings,
  adminListAccessCodes,
  adminCreateAccessCodes,
  adminDeleteAccessCode,
  adminGetPlanAnalytics,
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

function AdminBusinessPlanPage() {
  const getSettings = useServerFn(adminGetPlanSettings);
  const updateSettings = useServerFn(adminUpdatePlanSettings);
  const listCodes = useServerFn(adminListAccessCodes);
  const createCodes = useServerFn(adminCreateAccessCodes);
  const deleteCode = useServerFn(adminDeleteAccessCode);
  const getAnalytics = useServerFn(adminGetPlanAnalytics);

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

  const reload = async () => {
    const [s, c, a] = await Promise.all([getSettings(), listCodes(), getAnalytics()]);
    setSettings(s);
    setPassword(s.global_password ?? "");
    setIsOpen(s.is_open);
    setCodes(c.codes as Code[]);
    setAnalytics(a);
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
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
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
    </div>
  );
}
