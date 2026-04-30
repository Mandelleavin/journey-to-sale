import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "Kontakt z doradcą — 90 Dni" },
      {
        name: "description",
        content: "Zadaj pytanie doradcy — strategia, marketing, sprzedaż, technologia.",
      },
    ],
  }),
  component: AdvisorPage,
});

type AdvisorMsg = {
  id: string;
  advisor_type: string;
  message: string;
  reply: string | null;
  created_at: string;
  replied_at: string | null;
};

function AdvisorPage() {
  const { user } = useAuth();
  const [type, setType] = useState("strategy");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AdvisorMsg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("advisor_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMessages((data ?? []) as AdvisorMsg[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const send = async () => {
    if (!user || !message.trim()) return toast.error("Wpisz pytanie");
    const { error } = await supabase.from("advisor_messages").insert({
      user_id: user.id,
      advisor_type: type as never,
      message,
    });
    if (error) return toast.error(error.message);
    toast.success("Wysłano. Doradca odpowie wkrótce.");
    setMessage("");
    load();
  };

  return (
    <PageShell
      title="Kontakt z doradcą"
      subtitle="Zadaj konkretne pytanie — odpowiemy w ciągu 24h."
      showAdvisor={false}
    >
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Nowe pytanie</h2>
        <div className="space-y-3">
          <div className="grid md:grid-cols-[220px_1fr] gap-3">
            <div>
              <Label>Doradca</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategy">Strategia / sprzedaż</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="technical">Techniczny</SelectItem>
                  <SelectItem value="mindset">Mindset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Twoje pytanie</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Im konkretniej, tym lepsza odpowiedź. Opisz kontekst i co już próbowałeś/aś."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <Button onClick={send} className="bg-gradient-violet text-primary-foreground">
            <Sparkles className="w-4 h-4 mr-1" /> Wyślij
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Twoje rozmowy</h2>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Brak wiadomości</div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border p-4">
                <div className="text-xs text-muted-foreground mb-2">
                  {new Date(m.created_at).toLocaleString("pl-PL")} · {m.advisor_type}
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  <b>Ty:</b> {m.message}
                </p>
                {m.reply ? (
                  <div className="mt-3 rounded-xl bg-violet-soft p-3 text-sm whitespace-pre-wrap">
                    <b>Doradca:</b> {m.reply}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground italic">
                    Czeka na odpowiedź...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
