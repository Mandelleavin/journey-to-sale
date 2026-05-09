import { useState } from "react";
import { MessageCircle, X, Send, Wrench, Megaphone, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type AdvisorType = "technical" | "marketing";

export function AdvisorButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [advisor, setAdvisor] = useState<AdvisorType>("technical");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!user) return toast.error("Zaloguj się");
    if (!msg.trim() || msg.trim().length < 5) return toast.error("Napisz co najmniej kilka słów");
    setBusy(true);
    const { error } = await supabase.from("advisor_messages").insert({
      user_id: user.id,
      advisor_type: advisor,
      message: msg.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(
      `Wiadomość wysłana do ${advisor === "technical" ? "Marcina" : "Kasi"}. Odpowiedź w 24h.`,
    );
    setMsg("");
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-20 right-0 w-[340px] bg-card rounded-2xl border border-border shadow-card p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display font-bold text-base">Masz pytanie?</div>
              <div className="text-xs text-muted-foreground">
                Wybierz doradcę i napisz wiadomość
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-muted grid place-items-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <AdvisorChoice
              icon={Wrench}
              name="Marcin"
              role="Techniczny"
              gradient="bg-gradient-blue"
              selected={advisor === "technical"}
              onClick={() => setAdvisor("technical")}
            />
            <AdvisorChoice
              icon={Megaphone}
              name="Kasia"
              role="Marketingowy"
              gradient="bg-gradient-orange"
              selected={advisor === "marketing"}
              onClick={() => setAdvisor("marketing")}
            />
          </div>

          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={`Napisz do ${advisor === "technical" ? "Marcina" : "Kasi"}...`}
            className="mt-3 min-h-[90px] text-sm"
          />

          <Button
            onClick={send}
            disabled={busy}
            className="w-full mt-3 rounded-xl bg-gradient-violet text-primary-foreground hover:opacity-95 font-semibold"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Wyślij wiadomość
              </>
            )}
          </Button>

          <Link
            to="/accelerate"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2 justify-center w-full rounded-xl border border-orange/40 bg-orange/10 text-sm font-semibold py-2 text-orange-foreground hover:bg-orange/20"
          >
            <Rocket className="w-4 h-4" />
            Przyspiesz wdrożenie
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative h-14 pl-4 pr-5 rounded-full bg-gradient-violet text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-glow",
          !open && "pulse-ring",
        )}
      >
        <MessageCircle className="w-5 h-5" strokeWidth={2.4} />
        <span className="hidden sm:inline">Zapytaj doradcę</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green border-2 border-card" />
      </button>
    </div>
  );
}

function AdvisorChoice({
  icon: Icon,
  name,
  role,
  gradient,
  selected,
  onClick,
}: {
  icon: typeof Wrench;
  name: string;
  role: string;
  gradient: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
        selected
          ? "border-violet bg-violet-soft ring-2 ring-violet/20"
          : "border-border hover:bg-muted/50",
      )}
    >
      <div
        className={cn("w-9 h-9 rounded-lg grid place-items-center text-white shrink-0", gradient)}
      >
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-foreground leading-tight truncate">{name}</div>
        <div className="text-[10px] text-muted-foreground">{role}</div>
      </div>
    </button>
  );
}
