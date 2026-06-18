export type XpEventKind =
  | "onboarding"
  | "tool"
  | "lesson"
  | "task"
  | "course"
  | "challenge"
  | "badge"
  | "mission"
  | "streak"
  | "other";

export type FormattedXpReason = {
  title: string;
  kind: XpEventKind;
};

const TOOL_NAMES: Record<string, string> = {
  "first-product": "Kalkulator pierwszej sprzedaży",
  "revenue-potential": "Kalkulator potencjału przychodu",
  "product-price": "Kalkulator ceny produktu",
  "ads-breakeven": "Kalkulator rentowności reklam",
  "offer-builder": "Kreator oferty sprzedażowej",
  "landing-copy": "Generator landing page",
  "email-sequence": "Generator sekwencji maili",
  "ad-copy": "Generator reklam",
  "idea-generator": "Generator pomysłów",
};

function humanizeIdentifier(value: string) {
  return value
    .replace(/[:_]+/g, "-")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractToolSlug(reason: string) {
  const colonMatch = reason.match(/^tool:([^:]+)(?::\d{4}-\d{2}-\d{2})?$/i);
  if (colonMatch) return colonMatch[1].toLowerCase();

  return reason
    .replace(/^tool_/i, "")
    .replace(/[_:]\d{4}-\d{2}-\d{2}$/, "")
    .toLowerCase();
}

function detailAfterPrefix(reason: string, prefix: RegExp) {
  return reason.replace(prefix, "").trim();
}

export function formatXpReason(reason: string): FormattedXpReason {
  const normalized = reason.trim();
  const lower = normalized.toLowerCase();

  if (lower === "onboarding_starter" || lower.includes("onboarding")) {
    return { title: "Ukończenie wprowadzenia do aplikacji", kind: "onboarding" };
  }

  if (lower.startsWith("tool:") || lower.startsWith("tool_")) {
    const slug = extractToolSlug(normalized);
    const toolName = TOOL_NAMES[slug] ?? humanizeIdentifier(slug);
    return { title: `Zapisano wynik: ${toolName}`, kind: "tool" };
  }

  if (TOOL_NAMES[lower]) {
    return { title: `Zapisano wynik: ${TOOL_NAMES[lower]}`, kind: "tool" };
  }

  if (lower.startsWith("obejrzana lekcja:")) {
    const title = detailAfterPrefix(normalized, /^obejrzana lekcja:\s*/i);
    return {
      title: title ? `Ukończenie lekcji: ${title}` : "Ukończenie lekcji",
      kind: "lesson",
    };
  }

  if (lower.startsWith("zadanie od mentora:")) {
    const title = detailAfterPrefix(normalized, /^zadanie od mentora:\s*/i);
    return {
      title: title ? `Wykonanie zadania mentora: ${title}` : "Wykonanie zadania mentora",
      kind: "task",
    };
  }

  if (lower.includes("zatwierdz") && lower.includes("zadan")) {
    return { title: "Zadanie zatwierdzone przez mentora", kind: "task" };
  }

  if (lower.startsWith("wyzwanie:")) {
    const title = detailAfterPrefix(normalized, /^wyzwanie:\s*/i);
    return {
      title: title ? `Ukończenie wyzwania: ${title}` : "Ukończenie wyzwania",
      kind: "challenge",
    };
  }

  if (lower.includes("lekcj")) {
    return { title: normalized, kind: "lesson" };
  }
  if (lower.includes("zadan") || lower.includes("task")) {
    return { title: normalized, kind: "task" };
  }
  if (lower.includes("kurs") || lower.includes("course")) {
    return { title: normalized, kind: "course" };
  }
  if (lower.includes("badge") || lower.includes("odznak")) {
    return { title: normalized, kind: "badge" };
  }
  if (lower.includes("misj")) {
    return { title: normalized, kind: "mission" };
  }
  if (lower.includes("streak") || lower.includes("seri")) {
    return { title: normalized, kind: "streak" };
  }

  const looksTechnical = /^[a-z0-9_-]+$/i.test(normalized);
  return {
    title: looksTechnical ? humanizeIdentifier(normalized) : normalized,
    kind: "other",
  };
}
