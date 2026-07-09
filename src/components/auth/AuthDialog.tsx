import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Mail,
  Lock as LockIcon,
  User as UserIcon,
  Sparkles,
  Rocket,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LockKey } from "@/components/auth/LockKey";
import { cn } from "@/lib/utils";
import { getAuthErrorMessage, validateAuthForm, type AuthMode } from "@/lib/auth-errors";

type Mode = AuthMode;

type Ctx = {
  open: (mode?: Mode) => void;
  close: () => void;
};
const AuthDialogContext = createContext<Ctx | undefined>(undefined);

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used inside AuthDialogProvider");
  return ctx;
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");

  const api: Ctx = {
    open: (m = "signup") => {
      setMode(m);
      setOpen(true);
    },
    close: () => setOpen(false),
  };

  return (
    <AuthDialogContext.Provider value={api}>
      {children}
      <AuthDialog open={open} onOpenChange={setOpen} initialMode={mode} />
    </AuthDialogContext.Provider>
  );
}

const benefits = [
  "Plan 90 dni do pierwszej sprzedaży",
  "Generatory AI: oferta, landing, maile",
  "Mentor + społeczność, która Cię pilnuje",
  "Start za 0 zł — bez karty",
];

function AuthDialog({
  open,
  onOpenChange,
  initialMode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMode: Mode;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [hp, setHp] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setInfo(null);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (open && user) onOpenChange(false);
  }, [user, open, onOpenChange]);

  const passwordStrength = Math.min(1, password.length / 8);
  const unlocked = password.length >= 8;

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (hp) {
      setInfo("Sprawdź skrzynkę.");
      return;
    }
    const validationError = validateAuthForm({ mode, email, password });
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        onOpenChange(false);
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName.trim() || normalizedEmail.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("Konto utworzone! Sprawdź skrzynkę, żeby potwierdzić e-mail (jeśli wymagane).");
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          onOpenChange(false);
          navigate({ to: "/onboarding" });
        }
      } else if (mode === "reset") {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        });
        if (error) throw error;
        setInfo("Link do resetu hasła wysłany. Sprawdź skrzynkę.");
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, mode));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden border-0 bg-transparent shadow-none max-w-[980px] w-[calc(100%-1.5rem)] sm:w-full">
        <div className="relative rounded-3xl overflow-hidden bg-[#0F0D23] text-white shadow-2xl">
          {/* glow background */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full bg-violet blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-[360px] w-[360px] rounded-full bg-blue blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-pink-500/40 blur-3xl" />
          </div>

          <div className="relative grid md:grid-cols-[1.05fr_1fr]">
            {/* LEFT — narracja */}
            <div className="hidden md:flex flex-col justify-between p-8 border-r border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-soft backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> 90 dni do pierwszej sprzedaży
              </div>
              <div>
                <h2 className="font-display text-3xl lg:text-4xl font-extrabold leading-tight">
                  Otwórz drzwi do{" "}
                  <span className="bg-gradient-to-r from-violet-soft via-pink-300 to-orange-soft bg-clip-text text-transparent">
                    swojej pierwszej sprzedaży
                  </span>
                  .
                </h2>
                <ul className="mt-6 space-y-2.5 text-sm text-white/80">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet to-blue">
                        <Check className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50">
                <div className="flex -space-x-2">
                  {["bg-violet", "bg-pink-500", "bg-orange", "bg-blue"].map((c, i) => (
                    <div
                      key={i}
                      className={cn("h-7 w-7 rounded-full border-2 border-[#0F0D23]", c)}
                    />
                  ))}
                </div>
                <span>2 137 osób już zaczęło</span>
              </div>
            </div>

            {/* RIGHT — form */}
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex gap-1 rounded-full bg-white/5 p-1">
                <TabBtn active={mode === "signin"} onClick={() => changeMode("signin")}>
                  Logowanie
                </TabBtn>
                <TabBtn active={mode === "signup"} onClick={() => changeMode("signup")}>
                  Rejestracja
                </TabBtn>
                <TabBtn active={mode === "reset"} onClick={() => changeMode("reset")}>
                  Reset
                </TabBtn>
              </div>

              <h3 className="font-display text-2xl font-bold">
                {mode === "signin" && "Witaj z powrotem"}
                {mode === "signup" && "Zacznij swoją misję"}
                {mode === "reset" && "Odzyskaj dostęp"}
              </h3>
              <p className="mt-1 text-sm text-white/60">
                {mode === "signin" && "Zaloguj się, by kontynuować."}
                {mode === "signup" && "Załóż konto i rusz po pierwsze XP."}
                {mode === "reset" && "Wyślemy link do ustawienia nowego hasła."}
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="absolute h-0 w-0 opacity-0"
                  aria-hidden
                />

                {mode === "signup" && (
                  <Field
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Imię"
                    type="text"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Anna Nowak"
                  />
                )}

                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="ty@example.com"
                  required
                  autoFocus
                />

                {mode !== "reset" && (
                  <div>
                    <Label className="text-white/80">Hasło</Label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                        <LockIcon className="h-4 w-4" />
                      </span>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                        placeholder="min. 8 znaków"
                        className="border-white/10 bg-white/5 pl-9 pr-10 text-white placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                        aria-label={showPassword ? "Ukryj" : "Pokaż"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {mode === "signup" && (
                      <div className="mt-3">
                        <LockKey progress={passwordStrength} unlocked={unlocked} />
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-green-200">
                    {info}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={busy}
                  className="group w-full rounded-xl bg-gradient-to-r from-violet via-pink-500 to-blue text-base font-bold text-primary-foreground hover:opacity-95 shadow-[0_8px_30px_-8px_rgba(168,85,247,0.6)]"
                >
                  {busy ? (
                    "Chwila..."
                  ) : mode === "signin" ? (
                    "Zaloguj się"
                  ) : mode === "signup" ? (
                    <span className="inline-flex items-center gap-2">
                      <Rocket className="h-4 w-4" /> Załóż konto
                    </span>
                  ) : (
                    "Wyślij link"
                  )}
                </Button>

                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => changeMode("reset")}
                    className="w-full text-center text-xs text-white/60 hover:text-white"
                  >
                    Nie pamiętasz hasła?
                  </button>
                )}
                {mode === "signup" && (
                  <div className="text-center text-[11px] text-white/40">
                    Klikając "Załóż konto" akceptujesz regulamin i politykę prywatności.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition",
        active ? "bg-white text-[#0F0D23] shadow-sm" : "text-white/60 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: {
  icon: ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <Label className="text-white/80">{label}</Label>
      <div className="relative mt-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30"
        />
      </div>
    </div>
  );
}
