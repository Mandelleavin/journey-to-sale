import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase odczyta hash i wystawi sesję recovery automatycznie
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-app px-4">
      <form onSubmit={handle} className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold">Ustaw nowe hasło</h1>
        <p className="mt-1 text-sm text-muted-foreground">Wprowadź nowe hasło do konta.</p>
        {!ready && (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Otwórz ten link z e-maila do resetu — sesja odzyskiwania jest wymagana.
          </p>
        )}
        <div className="mt-6">
          <Label>Nowe hasło</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="mt-1"
          />
        </div>
        {error && <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        <Button type="submit" disabled={busy || !ready} className="mt-6 w-full rounded-xl bg-gradient-violet text-primary-foreground">
          {busy ? "Zapisuję..." : "Zapisz hasło"}
        </Button>
      </form>
    </div>
  );
}
