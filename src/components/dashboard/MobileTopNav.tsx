import { Link } from "@tanstack/react-router";
import { Menu, Sparkles, Plus, Home } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useCredits } from "@/hooks/useCredits";

export function MobileTopNav() {
  const { credits, loading } = useCredits();
  const available = credits?.available ?? 0;

  return (
    <div className="lg:hidden flex items-center gap-2 mb-3">
      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="Otwórz menu"
            className="w-11 h-11 shrink-0 rounded-2xl bg-card border border-border shadow-soft grid place-items-center hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" strokeWidth={2.2} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] bg-transparent border-0">
          <div className="p-2 h-full overflow-y-auto">
            {/* Re-use desktop sidebar inside sheet (forces visible) */}
            <div className="block [&>aside]:flex [&>aside]:sticky-0 [&>aside]:max-h-none">
              <Sidebar />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Link
        to="/"
        aria-label="Strona główna"
        className="w-11 h-11 shrink-0 rounded-2xl bg-card border border-border shadow-soft grid place-items-center hover:bg-muted transition-colors"
      >
        <Home className="w-5 h-5 text-foreground" strokeWidth={2.2} />
      </Link>

      <Link
        to="/credits"
        className="flex-1 min-w-0 rounded-2xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft px-3 py-2 shadow-soft flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Kredyty AI
          </div>
          <div className="font-display font-extrabold text-violet text-lg leading-none">
            {loading ? "…" : available}
            <span className="text-[10px] font-semibold text-muted-foreground ml-1 normal-case tracking-normal">
              dostępnych
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-card border border-border grid place-items-center shrink-0">
          <Plus className="w-4 h-4 text-violet" />
        </div>
      </Link>
    </div>
  );
}
