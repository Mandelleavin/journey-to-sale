export type AuthMode = "signin" | "signup" | "reset";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm({
  mode,
  email,
  password,
}: {
  mode: AuthMode;
  email: string;
  password: string;
}): string | null {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) return "Podaj adres e-mail.";
  if (!EMAIL_PATTERN.test(normalizedEmail)) return "Podaj poprawny adres e-mail.";

  if (mode !== "reset" && !password) return "Podaj hasło.";
  if (mode === "signup" && password.length < 8) {
    return "Hasło musi mieć co najmniej 8 znaków.";
  }

  return null;
}

export function getAuthErrorMessage(error: unknown, mode: AuthMode): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const message = rawMessage.toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    message.includes("email or password")
  ) {
    return "Nieprawidłowy e-mail lub hasło. Sprawdź dane i spróbuj ponownie.";
  }

  if (message.includes("email not confirmed")) {
    return "Najpierw potwierdź adres e-mail. Sprawdź wiadomość w swojej skrzynce.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("already registered")
  ) {
    return "Konto z tym adresem e-mail już istnieje. Zaloguj się lub zresetuj hasło.";
  }

  if (
    message.includes("password should be at least") ||
    message.includes("password must be at least") ||
    message.includes("weak password")
  ) {
    return "Hasło jest za krótkie. Użyj co najmniej 8 znaków.";
  }

  if (
    message.includes("invalid email") ||
    (message.includes("email address") && message.includes("invalid"))
  ) {
    return "Podaj poprawny adres e-mail.";
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("over_email_send_rate_limit")
  ) {
    return "Wykonano zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.";
  }

  if (message.includes("signup is disabled") || message.includes("signups not allowed")) {
    return "Rejestracja jest obecnie wyłączona. Skontaktuj się z administratorem.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj ponownie.";
  }

  if (mode === "reset") {
    return "Nie udało się wysłać linku do resetu hasła. Spróbuj ponownie za chwilę.";
  }

  if (mode === "signup") {
    return "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.";
  }

  return "Nie udało się zalogować. Spróbuj ponownie za chwilę.";
}
