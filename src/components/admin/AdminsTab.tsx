import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listAdmins, grantAdmin, revokeAdmin } from "@/lib/admins.functions";

type Row = {
  user_id: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
};

export function AdminsTab() {
  const { user } = useAuth();
  const fetchList = useServerFn(listAdmins);
  const grant = useServerFn(grantAdmin);
  const revoke = useServerFn(revokeAdmin);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchList({});
      setRows(data as Row[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd ładowania");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGrant = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await grant({ data: { email: email.trim() } });
      toast.success("Administrator dodany");
      setEmail("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się dodać");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (userId: string, label: string) => {
    if (!confirm(`Odebrać uprawnienia administratora: ${label}?`)) return;
    try {
      await revoke({ data: { userId } });
      toast.success("Uprawnienia odebrane");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się odebrać");
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet grid place-items-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">Administratorzy</h2>
          <p className="text-xs text-muted-foreground">
            Dodawaj i odbieraj uprawnienia admina. Użytkownik musi być najpierw zarejestrowany.
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGrant()}
          className="max-w-sm"
        />
        <Button
          onClick={handleGrant}
          disabled={busy || !email.trim()}
          className="bg-gradient-violet text-primary-foreground"
        >
          <UserPlus className="w-4 h-4 mr-1" /> Dodaj admina
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6">Ładowanie...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Użytkownik</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Dodany</th>
                <th className="py-2 px-2 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelf = r.user_id === user?.id;
                return (
                  <tr key={r.user_id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2 font-semibold">
                      {r.full_name ?? "—"}
                      {isSelf && (
                        <span className="ml-2 text-[10px] uppercase text-violet font-bold">Ty</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{r.email ?? "—"}</td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isSelf}
                        onClick={() => handleRevoke(r.user_id, r.email ?? r.user_id)}
                        className="text-orange hover:text-orange"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Odbierz
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground text-sm">
                    Brak administratorów
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
