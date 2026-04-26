import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock as LockIcon, User as UserIcon, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flashlight } from "@/components/auth/Flashlight";
import { LockKey } from "@/components/auth/LockKey";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "reset";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // Honeypot — bot wypełni, człowiek nie zobaczy
  const [hp, setHp] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  const passwordStrength = Math.min(1, password.length / 8);
  const unlocked = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (hp) {
      // honeypot — udajemy sukces
      setInfo("Sprawdź skrzynkę.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("Konto utworzone! Sprawdź skrzynkę, żeby potwierdzić e-mail (jeśli wymagane).");
        // jeżeli auto-confirm jest aktywny, po prostu zaloguj
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/onboarding" });
      } else if (mode === "reset") {
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setInfo("Link do resetu hasła wysłany. Sprawdź skrzynkę.");
      }
    } catch (err: any) {
      setError(err.message ?? "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F0D23] text-white">
      {/* tło */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-violet blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue blur-3xl" />
      </div>

      {/* latarka — tylko na ekranie hasła w sign in/sign up */}
      <Flashlight active={mode !== "reset" && password.length === 0} />

      <div className="relative z-30 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* lewa kolumna — narracja */}
          <div className="hidden flex-col justify-between lg:flex">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Powrót
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-soft backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> 90 dni do pierwszej sprzedaży
              </div>
              <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight">
                Otwórz drzwi do <span className="bg-gradient-to-r from-violet-soft via-pink-300 to-orange-soft bg-clip-text text-transparent">swojej pierwszej sprzedaży</span>.
              </h1>
              <p className="mt-4 max-w-md text-white/70">
                Klucz pasuje do zamka, gdy hasło ma minimum 8 znaków. Latarka pokazuje formularz tam, gdzie patrzysz.
              </p>
            </div>
            <div className="text-xs text-white/40">© {new Date().getFullYear()} 90 Dni</div>
          </div>

          {/* prawa kolumna — formularz */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex gap-2 rounded-full bg-white/5 p-1">
              <TabBtn active={mode === "signin"} onClick={() => setMode("signin")}>Logowanie</TabBtn>
              <TabBtn active={mode === "signup"} onClick={() => setMode("signup")}>Rejestracja</TabBtn>
              <TabBtn active={mode === "reset"} onClick={() => setMode("reset")}>Reset</TabBtn>
            </div>

            <h2 className="font-display text-2xl font-bold">
              {mode === "signin" && "Witaj z powrotem"}
              {mode === "signup" && "Zacznij swoją misję"}
              {mode === "reset" && "Odzyskaj dostęp"}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {mode === "signin" && "Zaloguj się, by kontynuować."}
              {mode === "signup" && "Załóż konto i rusz po pierwsze XP."}
              {mode === "reset" && "Wyślemy link do ustawienia nowego hasła."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {/* honeypot */}
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-3">
                    <LockKey progress={passwordStrength} unlocked={unlocked} />
                  </div>
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
                className="w-full rounded-xl bg-gradient-violet text-base font-bold text-primary-foreground hover:opacity-95"
              >
                {busy
                  ? "Chwila..."
                  : mode === "signin"
                  ? "Zaloguj się"
                  : mode === "signup"
                  ? "Załóż konto"
                  : "Wyślij link"}
              </Button>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="w-full text-center text-xs text-white/60 hover:text-white"
                >
                  Nie pamiętasz hasła?
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition",
        active ? "bg-white text-[#0F0D23]" : "text-white/60 hover:text-white",
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
  icon: React.ReactNode;
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
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>
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
