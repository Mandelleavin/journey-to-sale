import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { askCoach } from "@/server/gamification.functions";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({
  component: CoachPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function CoachPage() {
  const ask = useServerFn(askCoach);
  const [history, setHistory] = useState<Msg[]>([
    { role: "assistant", content: "Cześć! Jestem Twoim AI Coachem. Powiedz, w czym mogę pomóc — strategia, oferta, marketing, kolejny krok?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setHistory((h) => [...h, userMsg]);
    setInput("");
    setLoading(true);
    const res = await ask({
      data: { message: userMsg.content, history: history.slice(-10) },
    });
    setLoading(false);
    if (res.ok) {
      setHistory((h) => [...h, { role: "assistant", content: res.reply ?? "" }]);
      setRemaining(res.remaining ?? null);
    } else {
      toast.error(res.error ?? "Błąd");
    }
  };

  return (
    <PageShell title="AI Coach" subtitle="Spersonalizowane wskazówki na bazie Twojego profilu i postępów">
      <div className="rounded-3xl border border-border bg-card shadow-soft flex flex-col h-[600px]">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet grid place-items-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">Twój Coach</div>
            <div className="text-xs text-muted-foreground">
              {remaining !== null ? `${remaining} wiadomości pozostało dziś` : "Limit 20 wiadomości / dzień"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-gradient-violet text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground">Coach pisze...</div>}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Zadaj pytanie..."
            rows={1}
            className="resize-none"
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="bg-gradient-violet text-primary-foreground">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
