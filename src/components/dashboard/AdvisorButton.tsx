import { useState } from "react";
import { MessageCircle, X, Send, Wrench, Megaphone, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function AdvisorButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="absolute bottom-20 right-0 w-80 bg-card rounded-2xl border border-border shadow-card p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display font-bold text-base">Masz pytanie?</div>
              <div className="text-xs text-muted-foreground">
                Zapytaj jednego z naszych doradców
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-muted grid place-items-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <AdvisorRow icon={Wrench} name="Marcin" role="Techniczny" gradient="bg-gradient-blue" />
            <AdvisorRow
              icon={Megaphone}
              name="Kasia"
              role="Marketingowy"
              gradient="bg-gradient-orange"
            />
          </div>

          <Button className="w-full mt-4 rounded-xl bg-gradient-violet text-primary-foreground hover:bg-gradient-violet hover:opacity-95 font-semibold">
            <Send className="w-4 h-4" />
            Napisz wiadomość
          </Button>

          <Link
            to="/package"
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

function AdvisorRow({
  icon: Icon,
  name,
  role,
  gradient,
}: {
  icon: typeof Wrench;
  name: string;
  role: string;
  gradient: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors">
      <div
        className={cn("w-10 h-10 rounded-xl grid place-items-center text-white shrink-0", gradient)}
      >
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-foreground leading-tight">{name}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
        <span className="text-[11px] font-semibold text-green">Online</span>
      </div>
    </div>
  );
}
