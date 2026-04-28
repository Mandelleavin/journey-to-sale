import { Flame, LogOut, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SketchUnderline } from "./Sketch";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "./NotificationsBell";

type Props = {
  fullName?: string;
  notificationsCount?: number;
};

export function TopBar({ fullName, notificationsCount = 0 }: Props) {
  const { signOut, isAdmin } = useAuth();
  const name = fullName?.split(" ")[0] || "Twórco";
  const initials = (fullName ?? "TW")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-foreground tracking-tight">
            Cześć, {name}!
          </h1>
          <span className="text-3xl md:text-4xl">👋</span>
        </div>
        <SketchUnderline className="w-40 h-3 -mt-1 ml-1" />
        <p className="text-sm text-muted-foreground mt-2">Super, że znowu działasz nad swoim produktem!</p>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            to="/admin"
            className="rounded-xl bg-gradient-violet px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-glow inline-flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" /> Panel admina
          </Link>
        )}

        <div className="flex items-center gap-2 bg-card rounded-2xl border border-border shadow-soft px-3 py-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-orange grid place-items-center">
            <Flame className="w-4 h-4 text-white fill-white/30" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-extrabold text-sm">7 dni</div>
            <div className="text-[10px] text-muted-foreground font-semibold uppercase">seria</div>
          </div>
        </div>

        <NotificationsBell initialCount={notificationsCount} />

        <button
          onClick={() => signOut()}
          title="Wyloguj"
          className="w-12 h-12 rounded-2xl bg-card border border-border shadow-soft grid place-items-center hover:bg-muted transition-colors"
        >
          <LogOut className="w-5 h-5 text-foreground" strokeWidth={2.2} />
        </button>

        <Link to="/profile" title="Twój profil" className="w-12 h-12 rounded-full bg-gradient-violet p-[2px] hover:opacity-90 transition-opacity">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-soft to-blue-soft grid place-items-center font-display font-bold text-violet text-sm">
            {initials}
          </div>
        </Link>
      </div>
    </div>
  );
}
