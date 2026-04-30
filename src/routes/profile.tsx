import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, User, KeyRound, Zap, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

type XpRow = { id: string; amount: number; reason: string; created_at: string };

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <Link
          to="/"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Powrót do dashboardu
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-1">Twój profil</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Zarządzaj danymi, hasłem i przeglądaj postępy
        </p>

        <Tabs defaultValue="info">
          <TabsList className="grid grid-cols-4 max-w-lg">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-1" />
              Dane
            </TabsTrigger>
            <TabsTrigger value="password">
              <KeyRound className="w-4 h-4 mr-1" />
              Hasło
            </TabsTrigger>
            <TabsTrigger value="xp">
              <Zap className="w-4 h-4 mr-1" />
              XP
            </TabsTrigger>
            <TabsTrigger value="survey">
              <ClipboardList className="w-4 h-4 mr-1" />
              Ankieta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <InfoTab />
          </TabsContent>
          <TabsContent value="password" className="mt-6">
            <PasswordTab />
          </TabsContent>
          <TabsContent value="xp" className="mt-6">
            <XpTab />
          </TabsContent>
          <TabsContent value="survey" className="mt-6">
            <SurveyTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoTab() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Zapisano");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
      <div>
        <Label>Email</Label>
        <Input value={user?.email ?? ""} disabled />
      </div>
      <div>
        <Label>Imię i nazwisko</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label>Telefon</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+48..." />
      </div>
      <Button
        onClick={save}
        disabled={saving}
        className="bg-gradient-violet text-primary-foreground"
      >
        {saving ? "Zapisywanie..." : "Zapisz zmiany"}
      </Button>
    </div>
  );
}

function PasswordTab() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (pw.length < 8) return toast.error("Min. 8 znaków");
    if (pw !== pw2) return toast.error("Hasła się różnią");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Hasło zmienione");
      setPw("");
      setPw2("");
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
      <div>
        <Label>Nowe hasło</Label>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <div>
        <Label>Powtórz hasło</Label>
        <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      <Button
        onClick={save}
        disabled={saving}
        className="bg-gradient-violet text-primary-foreground"
      >
        {saving ? "Zmienianie..." : "Zmień hasło"}
      </Button>
    </div>
  );
}

function XpTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<XpRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_xp_log")
      .select("id, amount, reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setRows((data ?? []) as XpRow[]));
  }, [user]);

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-violet">{total}</span>
        <span className="text-sm text-muted-foreground">XP łącznie (ostatnie 50 wpisów)</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="py-2.5 flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">{r.reason}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("pl-PL")}
              </div>
            </div>
            <span className="font-bold text-green">+{r.amount}</span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">Brak wpisów XP</li>
        )}
      </ul>
    </div>
  );
}

function SurveyTab() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground mb-4">
        Możesz ponownie wypełnić ankietę profilującą — wynik nadpisze poprzedni.
      </p>
      <Link to="/onboarding">
        <Button className="bg-gradient-violet text-primary-foreground">
          Wypełnij ankietę ponownie
        </Button>
      </Link>
    </div>
  );
}
